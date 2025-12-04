import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentFilterDto } from './dto/department-filter.dto';
import { BaseService } from '../../common/services/base.service';
import { CsvService } from '../../common/services/csv.service';
import { DepartmentRepository } from './repositories/department.repository';
import {
  DepartmentCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../../common/dto/csv-bulk.dto';
import { Department } from '../../generated/prisma';
import { PaginatedResult } from '../../common/interfaces/base-service.interface';

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

  async findAll(
    query: DepartmentFilterDto = {},
  ): Promise<Department[] | PaginatedResult<Department>> {
    const where: Record<string, any> = { ...this.getActiveFilter() };

    if (query.searchTerm) {
      where.OR = [
        { name: { contains: query.searchTerm, mode: 'insensitive' } },
        { code: { contains: query.searchTerm, mode: 'insensitive' } },
      ];
    }

    if (query.hasCourses) {
      where.courses = { some: { isActive: true } };
    }

    if (query.withoutCourses) {
      where.courses = { none: { isActive: true } };
    }

    if (query.page && query.limit) {
      return this.findPaginated(where, query);
    }

    return this.getModel().findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(query),
    }) as Promise<Department[]>;
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

  async getDepartmentStatistics(): Promise<{
    totalDepartments: number;
    departmentsWithCourses: number;
    departmentsWithoutCourses: number;
    averageCoursesPerDepartment: number;
  }> {
    return this.departmentRepository.getDepartmentStats();
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
