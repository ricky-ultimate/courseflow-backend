import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseService } from '../common/services/base.service';
import { Course, Level } from '../generated/prisma';

@Injectable()
export class CoursesService extends BaseService<
  Course,
  CreateCourseDto,
  UpdateCourseDto
> {
  constructor(prisma: PrismaService) {
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
    return this.prisma.course.findMany({
      where: { departmentCode, isActive: true },
      include: { department: true },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  async findByLevel(level: Level): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { level, isActive: true },
      include: { department: true },
      orderBy: { code: 'asc' },
    });
  }
}
