import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { College, Department } from '../../../generated/prisma';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.department.count({
      where: { isActive: true, code },
    });
    return count > 0;
  }

  async getDepartmentStats(): Promise<{
    totalDepartments: number;
    departmentsWithCourses: number;
    departmentsWithoutCourses: number;
    averageCoursesPerDepartment: number;
  }> {
    const [totalDepartments, departmentsWithCourses, allCourses] =
      await Promise.all([
        this.prisma.department.count({ where: { isActive: true } }),
        this.prisma.department.count({
          where: {
            isActive: true,
            courses: { some: { isActive: true } },
          },
        }),
        this.prisma.course.count({ where: { isActive: true } }),
      ]);

    return {
      totalDepartments,
      departmentsWithCourses,
      departmentsWithoutCourses: totalDepartments - departmentsWithCourses,
      averageCoursesPerDepartment:
        totalDepartments > 0 ? allCourses / totalDepartments : 0,
    };
  }

  async bulkCreateWithValidation(
    departments: Array<{ code: string; name: string; college?: College }>,
  ): Promise<{
    created: Department[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const created: Department[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    const existingCodes = await this.prisma.department
      .findMany({
        where: { code: { in: departments.map((d) => d.code) } },
        select: { code: true },
      })
      .then((rows) => new Set(rows.map((r) => r.code)));

    for (let i = 0; i < departments.length; i++) {
      const departmentData = departments[i];

      if (existingCodes.has(departmentData.code)) {
        errors.push({
          index: i,
          error: `Department with code '${departmentData.code}' already exists`,
        });
        continue;
      }

      try {
        const newDepartment = await this.prisma.department.create({
          data: {
            code: departmentData.code,
            name: departmentData.name,
            ...(departmentData.college !== undefined
              ? { college: departmentData.college }
              : {}),
          },
        });
        created.push(newDepartment);
        existingCodes.add(departmentData.code);
      } catch (error) {
        errors.push({
          index: i,
          error: `Failed to create department: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
        });
      }
    }

    return { created, errors };
  }

  async findWithFullDetails(code: string): Promise<Department> {
    const department = await this.prisma.department.findUnique({
      where: { code },
      include: {
        courses: {
          where: { isActive: true },
          include: {
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                departmentCode: true,
              },
            },
            schedules: {
              orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
            },
          },
          orderBy: [{ level: 'asc' }, { code: 'asc' }],
        },
      },
    });

    if (!department) {
      throw new NotFoundException(`Department '${code}' not found`);
    }

    return department;
  }

  async safeDelete(code: string): Promise<{
    success: boolean;
    message: string;
    department?: Department;
  }> {
    const department = await this.prisma.department.findUnique({
      where: { code },
      include: {
        _count: { select: { courses: { where: { isActive: true } } } },
      },
    });

    if (!department) {
      return { success: false, message: `Department '${code}' not found` };
    }

    const coursesCount = department._count.courses;

    if (coursesCount > 0) {
      return {
        success: false,
        message: `Cannot delete department. It has ${coursesCount} active courses.`,
      };
    }

    const deleted = await this.prisma.department.update({
      where: { code },
      data: { isActive: false },
    });

    return {
      success: true,
      message: 'Department deleted successfully',
      department: deleted,
    };
  }
}
