import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(code: string) {
    const department = await this.prisma.department.findUnique({
      where: { code, isActive: true },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(code: string, dto: UpdateDepartmentDto) {
    await this.findOne(code);

    return this.prisma.department.update({
      where: { code },
      data: dto,
    });
  }

  async remove(code: string) {
    await this.findOne(code);

    return this.prisma.department.update({
      where: { code },
      data: { isActive: false },
    });
  }
}
