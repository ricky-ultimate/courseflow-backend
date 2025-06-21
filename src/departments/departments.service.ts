import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseService } from '../common/services/base.service';
import { CsvService } from '../common/services/csv.service';
import { DepartmentRepository } from './repositories/department.repository';
import {
  DepartmentCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../common/dto/csv-bulk.dto';
import { Department } from '../generated/prisma';

@Injectable()
export class DepartmentsService extends BaseService<
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto
> {
  constructor(
    prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly departmentRepository: DepartmentRepository,
  ) {
    super(prisma, {
      modelName: 'department',
      identifierField: 'code',
      uniqueFields: ['code', 'name'],
      softDelete: true,
      defaultOrderBy: { name: 'asc' },
    });
  }

  async bulkCreateFromCsv(
    buffer: Buffer,
  ): Promise<BulkOperationResult<Department>> {
    const requiredHeaders = ['code', 'name'];

    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      DepartmentCsvRowDto,
      requiredHeaders,
    );

    const allErrors: CsvValidationError[] = [...errors];

    if (data.length === 0) {
      return this.csvService.createBulkResult([], allErrors, errors.length);
    }

    const { created, errors: repositoryErrors } =
      await this.departmentRepository.bulkCreateWithValidation(
        data.map((departmentData) => ({
          code: departmentData.code,
          name: departmentData.name,
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
    const headers = ['code', 'name'];
    const sampleData = {
      code: 'CS',
      name: 'Computer Science',
    };

    return this.csvService.generateCsvTemplate(headers, sampleData);
  }

  async searchByName(searchTerm: string): Promise<Department[]> {
    return this.departmentRepository.searchByName(searchTerm);
  }

  async findWithCourses(): Promise<Department[]> {
    return this.departmentRepository.findWithCourses();
  }

  async findWithCourseCount(): Promise<
    Array<Department & { _count: { courses: number } }>
  > {
    return this.departmentRepository.findWithCourseCount();
  }

  async findWithoutCourses(): Promise<Department[]> {
    return this.departmentRepository.findWithoutCourses();
  }

  async getDepartmentStatistics(): Promise<{
    totalDepartments: number;
    departmentsWithCourses: number;
    departmentsWithoutCourses: number;
    averageCoursesPerDepartment: number;
  }> {
    return this.departmentRepository.getDepartmentStats();
  }

  async findByCriteria(criteria: {
    searchTerm?: string;
    hasCoursesOnly?: boolean;
    withoutCoursesOnly?: boolean;
  }): Promise<Department[]> {
    return this.departmentRepository.findByCriteria(criteria);
  }

  async findWithFullDetails(code: string): Promise<Department | null> {
    return this.departmentRepository.findWithFullDetails(code);
  }

  async safeDelete(code: string): Promise<{
    success: boolean;
    message: string;
    department?: Department;
  }> {
    return this.departmentRepository.safeDelete(code);
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.departmentRepository.existsByCode(code);
  }
}
