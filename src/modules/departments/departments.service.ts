import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
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
import { College, Department, Role } from '../../generated/prisma';
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
      includeRelations: {
        hod: { select: { id: true, name: true, email: true, role: true } },
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
    if (query.college) where.college = query.college;
    if (query.hasCourses) where.courses = { some: { isActive: true } };
    if (query.withoutCourses) where.courses = { none: { isActive: true } };

    if (query.page && query.limit) return this.findPaginated(where, query);

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
    if (dto.hodId) {
      await this.resolveHodId(dto.hodId);
    }
    return data;
  }

  protected async beforeUpdate(
    dto: UpdateDepartmentDto,
    identifier: string,
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = { ...dto };
    if (dto.hodId) {
      await this.resolveHodId(dto.hodId, identifier);
    }
    return data;
  }

  private async resolveHodId(
    hodId: string,
    currentDeptCode?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: hodId },
      include: { managedDepartment: true },
    });

    if (!user) throw new NotFoundException(`User with id '${hodId}' not found`);
    if (user.role === Role.STUDENT) {
      throw new BadRequestException(
        `User '${hodId}' must have HOD, LECTURER, or ADMIN role to be assigned as department head`,
      );
    }
    if (!user.isActive)
      throw new BadRequestException(`User '${hodId}' is not active`);

    if (
      user.managedDepartment &&
      user.managedDepartment.code !== currentDeptCode
    ) {
      throw new ConflictException(
        `User is already HOD of ${user.managedDepartment.name} (${user.managedDepartment.code})`,
      );
    }

    if (user.role !== Role.HOD && user.role !== Role.ADMIN) {
      await this.prisma.user.update({
        where: { id: hodId },
        data: { role: Role.HOD },
      });
    }
  }

  async remove(identifier: string): Promise<Department> {
    const result = await this.departmentRepository.safeDelete(identifier);
    if (!result.success) {
      throw new ConflictException(result.message);
    }
    if (!result.department) {
      throw new NotFoundException(`Department '${identifier}' not found`);
    }
    return result.department;
  }

  async lockSchedule(
    code: string,
    requestingUser: { id: string; role: string; collegeCode?: College },
  ): Promise<Department> {
    const dept = await this.findOne(code);
    if (requestingUser.role === Role.HOD) {
      await this.assertHodOwnsDepartment(requestingUser.id, code);
    }
    if (requestingUser.role === Role.COLLEGE_ADMIN) {
      this.assertCollegeAdminOwnsDepartment(
        requestingUser.collegeCode,
        (dept as unknown as { college: College }).college,
      );
    }
    return this.prisma.department.update({
      where: { code },
      data: { isScheduleLocked: true },
      include: {
        hod: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  async unlockSchedule(
    code: string,
    requestingUser: { id: string; role: string; collegeCode?: College },
  ): Promise<Department> {
    const dept = await this.findOne(code);
    if (requestingUser.role === Role.HOD) {
      await this.assertHodOwnsDepartment(requestingUser.id, code);
    }
    if (requestingUser.role === Role.COLLEGE_ADMIN) {
      this.assertCollegeAdminOwnsDepartment(
        requestingUser.collegeCode,
        (dept as unknown as { college: College }).college,
      );
    }
    return this.prisma.department.update({
      where: { code },
      data: { isScheduleLocked: false },
      include: {
        hod: { select: { id: true, name: true, email: true, role: true } },
      },
    });
  }

  private assertCollegeAdminOwnsDepartment(
    adminCollege: College | undefined,
    deptCollege: College,
  ): void {
    if (!adminCollege || adminCollege !== deptCollege) {
      throw new ForbiddenException(
        'College admins can only manage departments within their own college',
      );
    }
  }

  private async assertHodOwnsDepartment(
    hodUserId: string,
    departmentCode: string,
  ): Promise<void> {
    const hodUser = await this.prisma.user.findUnique({
      where: { id: hodUserId },
      include: { managedDepartment: true },
    });

    if (
      !hodUser?.managedDepartment ||
      hodUser.managedDepartment.code !== departmentCode
    ) {
      throw new ForbiddenException(
        'HODs can only lock or unlock their own department schedule',
      );
    }
  }

  async getProgrammes(
    code: string,
  ): Promise<Array<{ programme: string; count: number }>> {
    const dept = await this.prisma.department.findUnique({ where: { code } });
    if (!dept) {
      throw new NotFoundException(`Department '${code}' not found`);
    }

    const courses = await this.prisma.course.findMany({
      where: { departmentCode: code, isActive: true, isGeneral: false },
      select: { code: true },
    });

    const prefixMap = new Map<string, number>();
    for (const course of courses) {
      const match = /^([A-Z]+)/.exec(course.code);
      if (match?.[1]) {
        const prefix = match[1];
        prefixMap.set(prefix, (prefixMap.get(prefix) ?? 0) + 1);
      }
    }

    return Array.from(prefixMap.entries())
      .map(([programme, count]) => ({ programme, count }))
      .sort((a, b) => a.programme.localeCompare(b.programme));
  }

  async bulkCreateFromCsv(
    buffer: Buffer,
    collegeScope?: College,
  ): Promise<BulkOperationResult<Department>> {
    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      DepartmentCsvRowDto,
      ['code', 'name'],
    );
    const allErrors: CsvValidationError[] = [...errors];

    if (data.length === 0)
      return this.csvService.createBulkResult([], allErrors, errors.length);

    const rows = data.map((d) => ({
      code: d.code,
      name: d.name,
      ...(collegeScope ? { college: collegeScope } : {}),
    }));

    const { created, errors: repositoryErrors } =
      await this.departmentRepository.bulkCreateWithValidation(rows);

    for (const repoError of repositoryErrors) {
      allErrors.push({
        row: repoError.index + 2,
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
    return this.csvService.generateCsvTemplate(['code', 'name'], {
      code: 'CS',
      name: 'Computer Science',
    });
  }

  async getDepartmentStatistics() {
    return this.departmentRepository.getDepartmentStats();
  }

  async findWithFullDetails(code: string) {
    return this.departmentRepository.findWithFullDetails(code);
  }

  async existsByCode(code: string): Promise<boolean> {
    return this.departmentRepository.existsByCode(code);
  }
}
