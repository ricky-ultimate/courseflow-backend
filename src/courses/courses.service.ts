import { Injectable } from '@nestjs/common';
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
      includeRelations: { department: true },
      defaultOrderBy: { code: 'asc' },
    });
  }

  async findByDepartment(departmentCode: string): Promise<Course[]> {
    return this.courseRepository.findByDepartment(departmentCode);
  }

  async findByLevel(level: Level): Promise<Course[]> {
    return this.courseRepository.findByLevel(level);
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

    const { created, errors: repositoryErrors } =
      await this.courseRepository.bulkCreateWithValidation(
        data.map((courseData) => ({
          code: courseData.code,
          name: courseData.name,
          level: courseData.level,
          credits: courseData.credits,
          departmentCode: courseData.departmentCode,
        })),
      );

    for (const repoError of repositoryErrors) {
      const rowNumber = repoError.index + 2;
      allErrors.push({
        row: rowNumber,
        field: 'general',
        value: data[repoError.index],
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
    const headers = ['code', 'name', 'level', 'credits', 'departmentCode'];
    const sampleData = {
      code: 'CS101',
      name: 'Introduction to Programming',
      level: 'LEVEL_100',
      credits: '3',
      departmentCode: 'CS',
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
