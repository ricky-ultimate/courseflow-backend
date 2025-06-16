import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: dto,
    });
  }

  async findAll() {
    return this.prisma.course.findMany({
      where: { isActive: true },
      include: { department: true },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  async findOne(code: string) {
    const course = await this.prisma.course.findUnique({
      where: { code: code, isActive: true },
      include: { department: true },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async findByDepartment(departmentCode: string) {
    return this.prisma.course.findMany({
      where: { departmentCode, isActive: true },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  async findByLevel(level: string) {
    return this.prisma.course.findMany({
      where: { level: level as any, isActive: true },
      orderBy: { code: 'asc' },
    });
  }

  async update(code: string, dto: UpdateCourseDto) {
    await this.findOne(code);

    return this.prisma.course.update({
      where: { code },
      data: dto,
    });
  }

  async remove(code: string) {
    await this.findOne(code);

    return this.prisma.course.update({
      where: { code },
      data: { isActive: false },
    });
  }
}
