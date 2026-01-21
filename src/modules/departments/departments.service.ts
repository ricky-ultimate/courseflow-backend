import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
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
import { Department, Role } from '../../generated/prisma';
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
      // SECURITY FIX: Only select safe fields for HOD
      includeRelations: {
        hod: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            // phone: true, <--- REMOVED: User model does not have a phone field
          },
        },
      },
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

  protected async beforeCreate(
    dto: CreateDepartmentDto,
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = { ...dto };

    if (dto.hodEmail) {
      const hodId = await this.resolveHodEmailToId(dto.hodEmail);
      data.hodId = hodId;
      delete data.hodEmail;
    }

    return data;
  }

  protected async beforeUpdate(
    dto: UpdateDepartmentDto,
    identifier: string,
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = { ...dto };

    if (dto.hodEmail) {
      const hodId = await this.resolveHodEmailToId(dto.hodEmail, identifier);
      data.hodId = hodId;
      delete data.hodEmail;
    }

    return data;
  }

  private async resolveHodEmailToId(
    email: string,
    currentDeptCode?: string,
  ): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        managedDepartment: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with email '${email}' not found`);
    }

    if (
      user.role !== Role.HOD &&
      user.role !== Role.LECTURER &&
      user.role !== Role.ADMIN
    ) {
      throw new BadRequestException(
        `User with email '${email}' must have HOD, LECTURER, or ADMIN role to be assigned as department head`,
      );
    }

    if (!user.isActive) {
      throw new BadRequestException(`User with email '${email}' is not active`);
    }

    if (
      user.managedDepartment &&
      user.managedDepartment.code !== currentDeptCode
    ) {
      throw new ConflictException(
        `User is already HOD of ${user.managedDepartment.name} (${user.managedDepartment.code})`,
      );
    }

    if (user.role !== Role.HOD) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: Role.HOD },
      });
    }

    return user.id;
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
