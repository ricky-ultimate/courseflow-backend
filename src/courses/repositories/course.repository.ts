import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Course, Level } from '../../generated/prisma';

@Injectable()
export class CourseRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find courses by department code
   */
  async findByDepartment(departmentCode: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        departmentCode,
      },
      include: { department: true },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  /**
   * Find courses by academic level
   */
  async findByLevel(level: Level): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        level,
      },
      include: { department: true },
      orderBy: [{ departmentCode: 'asc' }, { code: 'asc' }],
    });
  }

  /**
   * Find courses by credit range
   */
  async findByCreditRange(
    minCredits: number,
    maxCredits: number,
  ): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        credits: {
          gte: minCredits,
          lte: maxCredits,
        },
      },
      include: { department: true },
      orderBy: [{ credits: 'asc' }, { code: 'asc' }],
    });
  }

  /**
   * Search courses by name (case-insensitive)
   */
  async searchByName(searchTerm: string): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Find courses by department and level
   */
  async findByDepartmentAndLevel(
    departmentCode: string,
    level: Level,
  ): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        departmentCode,
        level,
      },
      include: { department: true },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Check if course code exists
   */
  async existsByCode(code: string): Promise<boolean> {
    const count = await this.prisma.course.count({
      where: {
        isActive: true,
        code,
      },
    });
    return count > 0;
  }

  /**
   * Get course statistics
   */
  async getCourseStats(): Promise<{
    totalCourses: number;
    coursesByLevel: Record<Level, number>;
    coursesByDepartment: Record<string, number>;
    averageCredits: number;
  }> {
    const totalCourses = await this.prisma.course.count({
      where: { isActive: true },
    });

    // Get courses by level
    const coursesByLevel = {} as Record<Level, number>;
    for (const level of Object.values(Level)) {
      coursesByLevel[level] = await this.prisma.course.count({
        where: { isActive: true, level },
      });
    }

    // Get courses by department
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

    // Calculate average credits
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

  /**
   * Find courses with their schedules
   */
  async findWithSchedules(where?: Record<string, unknown>): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        ...where,
      },
      include: {
        department: true,
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Find courses without schedules
   */
  async findWithoutSchedules(): Promise<Course[]> {
    return this.prisma.course.findMany({
      where: {
        isActive: true,
        schedules: {
          none: {},
        },
      },
      include: { department: true },
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Bulk create courses with department validation
   */
  async bulkCreateWithValidation(
    courses: Array<{
      code: string;
      name: string;
      level: Level;
      credits: number;
      departmentCode: string;
    }>,
  ): Promise<{
    created: Course[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const created: Course[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];

      try {
        // Check if course code already exists
        const existingCourse = await this.existsByCode(courseData.code);
        if (existingCourse) {
          errors.push({
            index: i,
            error: `Course with code '${courseData.code}' already exists`,
          });
          continue;
        }

        // Check if department exists
        const department = await this.prisma.department.findUnique({
          where: { code: courseData.departmentCode },
        });

        if (!department) {
          errors.push({
            index: i,
            error: `Department with code '${courseData.departmentCode}' does not exist`,
          });
          continue;
        }

        const newCourse = await this.prisma.course.create({
          data: courseData,
          include: { department: true },
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

  /**
   * Find courses by multiple criteria
   */
  async findByCriteria(criteria: {
    departmentCode?: string;
    level?: Level;
    minCredits?: number;
    maxCredits?: number;
    searchTerm?: string;
  }): Promise<Course[]> {
    const where: Record<string, unknown> = {};

    if (criteria.departmentCode) {
      where.departmentCode = criteria.departmentCode;
    }

    if (criteria.level) {
      where.level = criteria.level;
    }

    if (
      criteria.minCredits !== undefined ||
      criteria.maxCredits !== undefined
    ) {
      where.credits = {};
      if (criteria.minCredits !== undefined) {
        (where.credits as Record<string, unknown>).gte = criteria.minCredits;
      }
      if (criteria.maxCredits !== undefined) {
        (where.credits as Record<string, unknown>).lte = criteria.maxCredits;
      }
    }

    if (criteria.searchTerm) {
      where.OR = [
        { name: { contains: criteria.searchTerm, mode: 'insensitive' } },
        { code: { contains: criteria.searchTerm, mode: 'insensitive' } },
      ];
    }

    return this.prisma.course.findMany({
      where: {
        isActive: true,
        ...where,
      },
      include: { department: true },
      orderBy: [{ departmentCode: 'asc' }, { level: 'asc' }, { code: 'asc' }],
    });
  }
}
