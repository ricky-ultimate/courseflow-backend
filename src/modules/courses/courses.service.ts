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
import { College, Course, Level, Role, Semester } from '../../generated/prisma';
import { PaginatedResult } from '../../common/interfaces/base-service.interface';

export interface CourseWithAliasWarnings extends Course {
  aliasWarnings?: string[];
}

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
      includeRelations: {
        department: true,
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            departmentCode: true,
          },
        },
      },
      defaultOrderBy: { code: 'asc' },
    });
  }

  async create(dto: CreateCourseDto): Promise<CourseWithAliasWarnings> {
    const { aliasOf, ...courseData } = dto;
    const course = await super.create(courseData as CreateCourseDto);

    if (!aliasOf?.length) return course;

    const warnings = await this.linkAliases(course.code, aliasOf);

    return warnings.length ? { ...course, aliasWarnings: warnings } : course;
  }

  async findAll(
    query: CourseFilterDto = {},
  ): Promise<Course[] | PaginatedResult<Course>> {
    const andConditions: Record<string, any>[] = [];

    if (this.config.softDelete) andConditions.push({ isActive: true });
    if (query.departmentCode) {
      if (query.includeGeneral) {
        andConditions.push({
          OR: [{ departmentCode: query.departmentCode }, { isGeneral: true }],
        });
      } else {
        andConditions.push({ departmentCode: query.departmentCode });
      }
    } else if (query.isGeneral !== undefined) {
      andConditions.push({ isGeneral: query.isGeneral });
    }
    if (query.level) andConditions.push({ level: query.level });
    if (query.semester) andConditions.push({ semester: query.semester });
    if (query.lecturerId) andConditions.push({ lecturerId: query.lecturerId });

    if (query.minCredits !== undefined || query.maxCredits !== undefined) {
      const creditFilter: Record<string, any> = {};
      if (query.minCredits !== undefined) creditFilter.gte = query.minCredits;
      if (query.maxCredits !== undefined) creditFilter.lte = query.maxCredits;
      andConditions.push({ credits: creditFilter });
    }

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

    const where = andConditions.length > 0 ? { AND: andConditions } : {};

    if (query.page && query.limit) return this.findPaginated(where, query);

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

    if (dto.lecturerId) {
      const lecturer = await this.prisma.user.findUnique({
        where: { id: dto.lecturerId, isActive: true },
      });
      if (!lecturer) {
        throw new NotFoundException(
          `Lecturer with id '${dto.lecturerId}' not found`,
        );
      }
      if (lecturer.role !== Role.LECTURER && lecturer.role !== Role.HOD) {
        throw new NotFoundException(
          `User '${dto.lecturerId}' is not a lecturer`,
        );
      }
    }

    return dto as Record<string, any>;
  }

  protected async beforeUpdate(
    dto: UpdateCourseDto,
    identifier: string,
  ): Promise<Record<string, any>> {
    const course = await this.prisma.course.findUnique({
      where: { code: identifier },
    });

    if (course?.isLocked && dto.isLocked !== false) {
      throw new ForbiddenException(
        'Cannot modify locked university courses. Unlock the course first.',
      );
    }

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

    if (dto.lecturerId) {
      const lecturer = await this.prisma.user.findUnique({
        where: { id: dto.lecturerId, isActive: true },
      });
      if (!lecturer) {
        throw new NotFoundException(
          `Lecturer with id '${dto.lecturerId}' not found`,
        );
      }
      if (lecturer.role !== Role.LECTURER && lecturer.role !== Role.HOD) {
        throw new NotFoundException(
          `User '${dto.lecturerId}' is not a lecturer`,
        );
      }
    }

    return dto as Record<string, any>;
  }

  async remove(identifier: string): Promise<Course> {
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
    collegeScope?: College,
  ): Promise<BulkOperationResult<Course>> {
    const requiredHeaders = [
      'code',
      'name',
      'level',
      'semester',
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

    if (collegeScope) {
      const deptCodes = [...new Set(data.map((r) => r.departmentCode))];
      const depts = await this.prisma.department.findMany({
        where: { code: { in: deptCodes } },
        select: { code: true, college: true },
      });
      const deptCollegeMap = new Map(depts.map((d) => [d.code, d.college]));

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        const deptCollege = deptCollegeMap.get(row.departmentCode);
        if (deptCollege && deptCollege !== collegeScope) {
          allErrors.push({
            row: i + 2,
            field: 'departmentCode',
            value: row.departmentCode,
            message: `Department '${row.departmentCode}' does not belong to your college (${collegeScope})`,
          });
        }
      }

      const errorRows = new Set(allErrors.map((e) => e.row));
      const filteredData = data.filter((_, i) => !errorRows.has(i + 2));

      if (filteredData.length === 0) {
        return this.csvService.createBulkResult(
          [],
          allErrors,
          data.length + errors.length,
        );
      }
    }

    const codeToAliasMap = new Map<string, string[]>();
    for (const row of data) {
      if (row.aliasOfCodes?.trim()) {
        const codes = row.aliasOfCodes
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
        if (codes.length) codeToAliasMap.set(row.code, codes);
      }
    }

    const lecturerEmails = [
      ...new Set(data.map((r) => r.lecturerEmail.toLowerCase())),
    ];
    const lecturers = await this.prisma.user.findMany({
      where: {
        email: { in: lecturerEmails, mode: 'insensitive' },
        role: { in: [Role.LECTURER, Role.HOD] },
        isActive: true,
      },
      select: { email: true, id: true },
    });

    const emailToIdMap = new Map(
      lecturers.map((l) => [l.email.toLowerCase(), l.id]),
    );

    const rowsForRepo: Array<{
      code: string;
      name: string;
      level: Level;
      semester: Semester;
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
          message: `Lecturer with email '${row.lecturerEmail}' not found or is not a lecturer.`,
        });
      } else {
        rowsForRepo.push({
          code: row.code,
          name: row.name,
          level: row.level,
          semester: row.semester,
          credits: row.credits,
          departmentCode: row.departmentCode,
          lecturerId,
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

    const aliasWarnings: string[] = [];
    for (const course of created) {
      const targets = codeToAliasMap.get(course.code) ?? [];
      if (targets.length) {
        const warnings = await this.linkAliases(course.code, targets);
        aliasWarnings.push(...warnings);
      }
    }

    return this.csvService.createBulkResult(
      created,
      allErrors,
      data.length + errors.length,
      aliasWarnings,
    );
  }

  generateCsvTemplate(): string {
    const headers = [
      'code',
      'name',
      'level',
      'semester',
      'credits',
      'departmentCode',
      'lecturerEmail',
      'aliasOfCodes',
    ];
    const sampleData = {
      code: 'CSC101',
      name: 'Introduction to Programming',
      level: 'LEVEL_100',
      semester: 'FIRST',
      credits: '3',
      departmentCode: 'CSC',
      lecturerEmail: 'lecturer@university.edu',
      aliasOfCodes: '',
    };
    return this.csvService.generateCsvTemplate(headers, sampleData);
  }

  async findWithoutSchedules(): Promise<Course[]> {
    return this.courseRepository.findWithoutSchedules();
  }

  async getCourseStats() {
    return this.courseRepository.getCourseStats();
  }

  async findUniversityCoursesWithoutSchedules(): Promise<Course[]> {
    return this.courseRepository.findUniversityCoursesWithoutSchedules();
  }

  private async linkAliases(
    courseCode: string,
    targets: string[],
  ): Promise<string[]> {
    const warnings: string[] = [];

    for (const targetCode of targets) {
      if (targetCode === courseCode) {
        warnings.push(`${targetCode}: a course cannot alias itself`);
        continue;
      }

      const target = await this.prisma.course.findUnique({
        where: { code: targetCode },
      });

      if (!target) {
        warnings.push(`${targetCode}: course not found, link skipped`);
        continue;
      }

      const existing = await this.prisma.courseAlias.findFirst({
        where: {
          OR: [
            { primaryCode: courseCode, aliasCode: targetCode },
            { primaryCode: targetCode, aliasCode: courseCode },
          ],
        },
      });

      if (existing) {
        warnings.push(`${targetCode}: alias relationship already exists`);
        continue;
      }

      await this.prisma.courseAlias.create({
        data: { primaryCode: courseCode, aliasCode: targetCode },
      });
    }

    return warnings;
  }
}
