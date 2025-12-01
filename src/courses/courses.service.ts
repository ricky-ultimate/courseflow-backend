import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseService } from '../common/services/base.service';
import { CsvService } from '../common/services/csv.service';
import { CourseRepository } from './repositories/course.repository';
import {
  CourseCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../common/dto/csv-bulk.dto';
import { Course, Level } from '../generated/prisma';

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

  async findByDepartment(departmentCode: string): Promise<Course[]> {
    return this.courseRepository.findByDepartment(departmentCode);
  }

  async findByLevel(level: Level): Promise<Course[]> {
    return this.courseRepository.findByLevel(level);
  }

  protected async beforeCreate(
    dto: CreateCourseDto,
  ): Promise<Record<string, any>> {
    // Validate Department
    const department = await this.prisma.department.findUnique({
      where: { code: dto.departmentCode },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with code '${dto.departmentCode}' not found`,
      );
    }

    // Validate Lecturer
    const lecturer = await this.prisma.lecturer.findUnique({
      where: { id: dto.lecturerId },
    });

    if (!lecturer) {
      throw new NotFoundException(
        `Lecturer with ID '${dto.lecturerId}' not found`,
      );
    }

    return dto as Record<string, any>;
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
      code: 'CS101',
      name: 'Introduction to Programming',
      level: 'LEVEL_100',
      credits: '3',
      departmentCode: 'CS',
      lecturerEmail: 'lecturer@university.edu',
    };

    return this.csvService.generateCsvTemplate(headers, sampleData);
  }

  async findByCreditRange(
    minCredits: number,
    maxCredits: number,
  ): Promise<Course[]> {
    return this.courseRepository.findByCreditRange(minCredits, maxCredits);
  }

  async searchByName(searchTerm: string): Promise<Course[]> {
    return this.courseRepository.searchByName(searchTerm);
  }

  async findByDepartmentAndLevel(
    departmentCode: string,
    level: Level,
  ): Promise<Course[]> {
    return this.courseRepository.findByDepartmentAndLevel(
      departmentCode,
      level,
    );
  }

  async findWithSchedules(where?: Record<string, any>): Promise<Course[]> {
    return this.courseRepository.findWithSchedules(where);
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

  async findByCriteria(criteria: {
    departmentCode?: string;
    level?: any;
    minCredits?: number;
    maxCredits?: number;
    searchTerm?: string;
  }): Promise<Course[]> {
    return this.courseRepository.findByCriteria(criteria);
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.courseRepository.existsByCode(code);
  }
}
