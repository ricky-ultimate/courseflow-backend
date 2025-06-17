import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseService } from '../common/services/base.service';
import { Department } from '../generated/prisma';

@Injectable()
export class DepartmentsService extends BaseService<Department> {
  constructor(prisma: PrismaService) {
    super(prisma, 'department');
  }

  async create(dto: CreateDepartmentDto): Promise<Department> {
    return this.prisma.department.create({
      data: dto,
    });
  }

  async findAll(): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(code: string): Promise<Department> {
    return this.findEntityOrThrow(
      { code, isActive: true },
      'Department not found',
    );
  }

  async update(code: string, dto: UpdateDepartmentDto): Promise<Department> {
    await this.findOne(code);
    return this.prisma.department.update({
      where: { code },
      data: dto,
    });
  }

  async remove(code: string): Promise<Department> {
    await this.findOne(code);
    return this.softDelete({ code });
  }
}
