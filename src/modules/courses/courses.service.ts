import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { BaseService } from '../../common/services/base.service';
import { CsvService } from '../../common/services/csv.service';
import { CourseRepository } from './repositories/course.repository';
import {
  CourseCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../../common/dto/csv-bulk.dto';
import { Course, Level } from '../../generated/prisma';
import { PaginatedResult } from '../../common/interfaces/base-service.interface';

@Injectable()
export class CoursesService extends BaseService<
  Course,
  CreateCourseDto,
  UpdateCourseDto
> {
  constructor(
    prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly courseRepository: CourseRepository,
  ) {
    super(prisma, {
      modelName: 'course',
      identifierField: 'code',
      uniqueFields: ['code'],
      softDelete: true,
      includeRelations: { department: true, lecturer: true },
      defaultOrderBy: { code: 'asc' },
    });
  }

  async findAll(
    query: CourseFilterDto = {},
  ): Promise<Course[] | PaginatedResult<Course>> {
    const andConditions: Record<string, any>[] = [];

    // 1. Soft Delete Filter
    if (this.config.softDelete) {
      andConditions.push({ isActive: true });
    }

    // 2. Department & General Course Logic
    // If "includeGeneral" is true, we fetch: (DeptCode == X) OR (isGeneral == true)
    if (query.departmentCode) {
      if (query.includeGeneral) {
        andConditions.push({
          OR: [
            { departmentCode: query.departmentCode },
            { isGeneral: true },
          ],
        });
      } else {
        andConditions.push({ departmentCode: query.departmentCode });
      }
    } else if (query.isGeneral !== undefined) {
      // If no department is specified, filter strictly by isGeneral status
      andConditions.push({ isGeneral: query.isGeneral });
    }

    // 3. Level & Semester Filters (Apply to both General and Department courses)
    if (query.level) {
      andConditions.push({ level: query.level });
    }

    if (query.semester) {
      andConditions.push({ semester: query.semester });
    }

    // 4. Lecturer Filter
    if (query.lecturerEmail) {
      andConditions.push({
        lecturer: {
          email: {
            equals: query.lecturerEmail,
            mode: 'insensitive',
          },
        },
      });
    }

    // 5. Credit Range Filter
    if (query.minCredits !== undefined || query.maxCredits !== undefined) {
      const creditFilter: Record<string, any> = {};
      if (query.minCredits !== undefined) creditFilter.gte = query.minCredits;
      if (query.maxCredits !== undefined) creditFilter.lte = query.maxCredits;
      andConditions.push({ credits: creditFilter });
    }

    // 6. Search Term (OR condition nested inside main AND)
    if (query.searchTerm) {
      andConditions.push({
        OR: [
          { name: { contains: query.searchTerm, mode: 'insensitive' } },
          { code: { contains: query.searchTerm, mode: 'insensitive' } },
          {
            lecturer: {
              name: { contains: query.searchTerm, mode: 'insensitive' },
            },
          },
        ],
      });
    }

    // Construct final where clause
    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    if (query.page && query.limit) {
      return this.findPaginated(where, query);
    }

    return this.getModel().findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(query),
    }) as Promise<Course[]>;
  }

  protected async beforeCreate(
    dto: CreateCourseDto,
  ): Promise<Record<string, any>> {
    const department = await this.prisma.department.findUnique({
      where: { code: dto.departmentCode },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with code '${dto.departmentCode}' not found`,
      );
    }

    const lecturer = await this.prisma.lecturer.findUnique({
      where: { email: dto.lecturerEmail },
    });

    if (!lecturer) {
      throw new NotFoundException(
        `Lecturer with email '${dto.lecturerEmail}' not found`,
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { lecturerEmail, ...rest } = dto;
    return {
      ...rest,
      lecturerId: lecturer.id,
    };
  }

  protected async beforeUpdate(
    dto: UpdateCourseDto,
    identifier: string,
  ): Promise<Record<string, any>> {
    // Check if course is locked
    const course = await this.prisma.course.findUnique({
      where: { code: identifier },
    });

    // Prevent modification of locked courses (e.g., GST/PIF)
    if (course?.isLocked) {
      // Allow unlocking only if explicitly sending isLocked: false
      if (dto.isLocked === false) {
        // Proceed to allow unlocking
      } else {
        throw new ForbiddenException(
          'Cannot modify locked university courses. Unlock the course first.',
        );
      }
    }

    const data: Record<string, any> = { ...dto };

    if (dto.departmentCode) {
      const department = await this.prisma.department.findUnique({
        where: { code: dto.departmentCode },
      });
      if (!department) {
        throw new NotFoundException(
          `Department with code '${dto.departmentCode}' not found`,
        );
      }
    }

    if (dto.lecturerEmail) {
      const lecturer = await this.prisma.lecturer.findUnique({
        where: { email: dto.lecturerEmail },
      });

      if (!lecturer) {
        throw new NotFoundException(
          `Lecturer with email '${dto.lecturerEmail}' not found`,
        );
      }

      data.lecturerId = lecturer.id;
      delete data.lecturerEmail;
    }

    return data;
  }

  async remove(identifier: string): Promise<Course> {
    // Check if course is locked
    const course = await this.prisma.course.findUnique({
      where: { code: identifier },
    });

    if (course?.isLocked) {
      throw new ForbiddenException(
        'Cannot delete locked university courses (e.g. GST, PIF).',
      );
    }

    return super.remove(identifier);
  }

  async bulkCreateFromCsv(
    buffer: Buffer,
  ): Promise<BulkOperationResult<Course>> {
    const requiredHeaders = [
      'code',
      'name',
      'level',
      'credits',
      'departmentCode',
      'lecturerEmail',
    ];

    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      CourseCsvRowDto,
      requiredHeaders,
    );

    const allErrors: CsvValidationError[] = [...errors];

    if (data.length === 0) {
      return this.csvService.createBulkResult([], allErrors, errors.length);
    }

    const lecturerEmails = [
      ...new Set(data.map((row) => row.lecturerEmail.toLowerCase())),
    ];
    const lecturers = await this.prisma.lecturer.findMany({
      where: {
        email: { in: lecturerEmails, mode: 'insensitive' },
      },
      select: { email: true, id: true },
    });

    const emailToIdMap = new Map<string, string>();
    lecturers.forEach((l) => emailToIdMap.set(l.email.toLowerCase(), l.id));

    const rowsForRepo: Array<{
      code: string;
      name: string;
      level: Level;
      credits: number;
      departmentCode: string;
      lecturerId: string;
    }> = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const lecturerId = emailToIdMap.get(row.lecturerEmail.toLowerCase());

      if (!lecturerId) {
        allErrors.push({
          row: i + 2,
          field: 'lecturerEmail',
          value: row.lecturerEmail,
          message: `Lecturer with email '${row.lecturerEmail}' not found. Please create the lecturer first.`,
        });
      } else {
        rowsForRepo.push({
          code: row.code,
          name: row.name,
          level: row.level,
          credits: row.credits,
          departmentCode: row.departmentCode,
          lecturerId: lecturerId,
        });
      }
    }

    if (rowsForRepo.length === 0) {
      return this.csvService.createBulkResult(
        [],
        allErrors,
        data.length + errors.length,
      );
    }

    const { created, errors: repositoryErrors } =
      await this.courseRepository.bulkCreateWithValidation(rowsForRepo);

    for (const repoError of repositoryErrors) {
      const originalRow = data.find(
        (d) => d.code === rowsForRepo[repoError.index].code,
      );
      allErrors.push({
        row: 0,
        field: 'general',
        value: originalRow ? originalRow.code : 'Unknown',
        message: repoError.error,
      });
    }

    return this.csvService.createBulkResult(
      created,
      allErrors,
      data.length + errors.length,
    );
  }

  generateCsvTemplate(): string {
    const headers = [
      'code',
      'name',
      'level',
      'credits',
      'departmentCode',
      'lecturerEmail',
    ];
    const sampleData = {
      code: 'CSC101',
      name: 'Introduction to Programming',
      level: 'LEVEL_100',
      credits: '3',
      departmentCode: 'CSC',
      lecturerEmail: 'lecturer@university.edu',
    };

    return this.csvService.generateCsvTemplate(headers, sampleData);
  }

  async findWithoutSchedules(): Promise<Course[]> {
    return this.courseRepository.findWithoutSchedules();
  }

  async getCourseStatistics(): Promise<{
    totalCourses: number;
    coursesByLevel: Record<string, number>;
    coursesByDepartment: Record<string, number>;
    averageCredits: number;
  }> {
    return this.courseRepository.getCourseStats();
  }
}
