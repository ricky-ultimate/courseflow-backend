import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateCourseAliasDto } from './dto/create-course-alias.dto';
import { CourseAlias } from '../../generated/prisma';

@Injectable()
export class CourseAliasesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCourseAliasDto): Promise<CourseAlias> {
    if (dto.primaryCode === dto.aliasCode) {
      throw new BadRequestException('A course cannot be an alias of itself');
    }

    const [primary, alias] = await Promise.all([
      this.prisma.course.findUnique({ where: { code: dto.primaryCode } }),
      this.prisma.course.findUnique({ where: { code: dto.aliasCode } }),
    ]);

    if (!primary) {
      throw new NotFoundException(`Course '${dto.primaryCode}' not found`);
    }
    if (!alias) {
      throw new NotFoundException(`Course '${dto.aliasCode}' not found`);
    }

    const existing = await this.prisma.courseAlias.findFirst({
      where: {
        OR: [
          { primaryCode: dto.primaryCode, aliasCode: dto.aliasCode },
          { primaryCode: dto.aliasCode, aliasCode: dto.primaryCode },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('This alias relationship already exists');
    }

    return this.prisma.courseAlias.create({
      data: {
        primaryCode: dto.primaryCode,
        aliasCode: dto.aliasCode,
      },
      include: {
        primaryCourse: {
          select: { code: true, name: true, departmentCode: true },
        },
        aliasCourse: {
          select: { code: true, name: true, departmentCode: true },
        },
      },
    });
  }

  async findAll(): Promise<CourseAlias[]> {
    return this.prisma.courseAlias.findMany({
      include: {
        primaryCourse: {
          select: { code: true, name: true, departmentCode: true, level: true },
        },
        aliasCourse: {
          select: { code: true, name: true, departmentCode: true, level: true },
        },
      },
      orderBy: { primaryCode: 'asc' },
    });
  }

  async findForCourse(code: string): Promise<CourseAlias[]> {
    return this.prisma.courseAlias.findMany({
      where: {
        OR: [{ primaryCode: code }, { aliasCode: code }],
      },
      include: {
        primaryCourse: {
          select: { code: true, name: true, departmentCode: true, level: true },
        },
        aliasCourse: {
          select: { code: true, name: true, departmentCode: true, level: true },
        },
      },
    });
  }

  async remove(id: string): Promise<CourseAlias> {
    const alias = await this.prisma.courseAlias.findUnique({ where: { id } });
    if (!alias) {
      throw new NotFoundException(`Course alias '${id}' not found`);
    }
    return this.prisma.courseAlias.delete({ where: { id } });
  }

  async getAliasedCourseCodes(code: string): Promise<string[]> {
    const aliases = await this.prisma.courseAlias.findMany({
      where: {
        OR: [{ primaryCode: code }, { aliasCode: code }],
      },
      select: { primaryCode: true, aliasCode: true },
    });

    const codes = new Set<string>();
    for (const a of aliases) {
      if (a.primaryCode !== code) codes.add(a.primaryCode);
      if (a.aliasCode !== code) codes.add(a.aliasCode);
    }
    return Array.from(codes);
  }
}
