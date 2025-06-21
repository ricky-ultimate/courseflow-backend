import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Department } from '../../generated/prisma';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async searchByName(searchTerm: string): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: {
        isActive: true,
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.department.count({
      where: {
        isActive: true,
        code,
      },
    });
    return count > 0;
  }

  async findWithCourses(): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        courses: {
          where: { isActive: true },
          orderBy: [{ level: 'asc' }, { code: 'asc' }],
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findWithCourseCount(): Promise<
    Array<Department & { _count: { courses: number } }>
  > {
    return (await this.prisma.department.findMany({
      where: { isActive: true },
      include: {
        _count: {
          select: {
            courses: {
              where: { isActive: true },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    })) as unknown as Array<Department & { _count: { courses: number } }>;
  }

  async findWithoutCourses(): Promise<Department[]> {
    return this.prisma.department.findMany({
      where: {
        isActive: true,
        courses: {
          none: {
            isActive: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getDepartmentStats(): Promise<{
    totalDepartments: number;
    departmentsWithCourses: number;
    departmentsWithoutCourses: number;
    averageCoursesPerDepartment: number;
  }> {
    const totalDepartments = await this.prisma.department.count({
      where: { isActive: true },
    });

    const departmentsWithCourses = await this.prisma.department.count({
      where: {
        isActive: true,
        courses: {
          some: {
            isActive: true,
          },
        },
      },
    });

    const departmentsWithoutCourses = totalDepartments - departmentsWithCourses;

    const allCourses = await this.prisma.course.count({
      where: { isActive: true },
    });

    const averageCoursesPerDepartment =
      totalDepartments > 0 ? allCourses / totalDepartments : 0;

    return {
      totalDepartments,
      departmentsWithCourses,
      departmentsWithoutCourses,
      averageCoursesPerDepartment,
    };
  }

  async bulkCreateWithValidation(
    departments: Array<{
      code: string;
      name: string;
    }>,
  ): Promise<{
    created: Department[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const created: Department[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < departments.length; i++) {
      const departmentData = departments[i];

      try {
        const existingDepartment = await this.existsByCode(departmentData.code);
        if (existingDepartment) {
          errors.push({
            index: i,
            error: `Department with code '${departmentData.code}' already exists`,
          });
          continue;
        }

        const newDepartment = await this.prisma.department.create({
          data: departmentData,
        });
        created.push(newDepartment);
      } catch (error) {
        errors.push({
          index: i,
          error: `Failed to create department: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return { created, errors };
  }

  async findByCriteria(criteria: {
    searchTerm?: string;
    hasCoursesOnly?: boolean;
    withoutCoursesOnly?: boolean;
  }): Promise<Department[]> {
    const where: Record<string, unknown> = {};

    if (criteria.searchTerm) {
      where.OR = [
        { name: { contains: criteria.searchTerm, mode: 'insensitive' } },
        { code: { contains: criteria.searchTerm, mode: 'insensitive' } },
      ];
    }

    if (criteria.hasCoursesOnly) {
      where.courses = {
        some: {
          isActive: true,
        },
      };
    }

    if (criteria.withoutCoursesOnly) {
      where.courses = {
        none: {
          isActive: true,
        },
      };
    }

    return this.prisma.department.findMany({
      where: {
        isActive: true,
        ...where,
      },
      orderBy: { name: 'asc' },
    });
  }

  async findWithFullDetails(code: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
      where: { code },
      include: {
        courses: {
          where: { isActive: true },
          include: {
            schedules: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
          },
          orderBy: [{ level: 'asc' }, { code: 'asc' }],
        },
      },
    });
  }

  async updateWithCascade(
    code: string,
    data: Partial<{ name: string; code: string }>,
  ): Promise<Department> {
    if (data.code && data.code !== code) {
      throw new Error('Department code changes require special handling');
    }

    return this.prisma.department.update({
      where: { code },
      data,
    });
  }

  async safeDelete(code: string): Promise<{
    success: boolean;
    message: string;
    department?: Department;
  }> {
    const coursesCount = await this.prisma.course.count({
      where: {
        departmentCode: code,
        isActive: true,
      },
    });

    if (coursesCount > 0) {
      return {
        success: false,
        message: `Cannot delete department. It has ${coursesCount} active courses.`,
      };
    }

    const deletedDepartment = await this.prisma.department.update({
      where: { code },
      data: { isActive: false },
    });
    return {
      success: true,
      message: 'Department deleted successfully',
      department: deletedDepartment,
    };
  }
}
