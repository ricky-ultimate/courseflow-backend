import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Course, Level } from '../../../generated/prisma';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.course.count({
      where: { isActive: true, code },
    });
    return count > 0;
  }

  async getCourseStats() {
    const totalCourses = await this.prisma.course.count({
      where: { isActive: true },
    });

    const coursesByLevel = {} as Record<Level, number>;
    for (const level of Object.values(Level)) {
      coursesByLevel[level] = await this.prisma.course.count({
        where: { isActive: true, level },
      });
    }

    const departments = await this.prisma.department.findMany({
      where: { isActive: true },
      select: { code: true },
    });

    const coursesByDepartment: Record<string, number> = {};
    for (const dept of departments) {
      coursesByDepartment[dept.code] = await this.prisma.course.count({
        where: { isActive: true, departmentCode: dept.code },
      });
    }

    const creditSum = await this.prisma.course.aggregate({
      where: { isActive: true },
      _avg: { credits: true },
    });

    return {
      totalCourses,
      coursesByLevel,
      coursesByDepartment,
      averageCredits: creditSum._avg.credits || 0,
    };
  }

  async findWithoutSchedules(): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: { isActive: true, schedules: { none: {} } },
      include: {
        department: true,
        lecturer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            departmentCode: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async bulkCreateWithValidation(
    courses: Array<{
      code: string;
      name: string;
      level: Level;
      credits: number;
      departmentCode: string;
      lecturerId: string;
    }>,
  ) {
    const created: Course[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];
      try {
        if (await this.existsByCode(courseData.code)) {
          errors.push({
            index: i,
            error: `Course with code '${courseData.code}' already exists`,
          });
          continue;
        }

        const department = await this.prisma.department.findUnique({
          where: { code: courseData.departmentCode },
        });
        if (!department) {
          errors.push({
            index: i,
            error: `Department '${courseData.departmentCode}' does not exist`,
          });
          continue;
        }

        const lecturer = await this.prisma.user.findUnique({
          where: { id: courseData.lecturerId },
        });
        if (!lecturer) {
          errors.push({
            index: i,
            error: `Lecturer with id '${courseData.lecturerId}' does not exist`,
          });
          continue;
        }

        const newCourse = await this.prisma.course.create({
          data: courseData,
          include: {
            department: true,
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                departmentCode: true,
              },
            },
          },
        });
        created.push(newCourse);
      } catch (error) {
        errors.push({
          index: i,
          error: `Failed to create course: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    return { created, errors };
  }
}
