import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Department } from '../../../generated/prisma';

@Injectable()
export class DepartmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.department.count({
      where: {
        isActive: true,
        code,
      },
    });
    return count > 0;
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

  async findWithFullDetails(code: string): Promise<Department | null> {
    return this.prisma.department.findUnique({
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
