import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Course, Level, Semester } from '../../../generated/prisma';

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
    const [totalCourses, levelGroups, departmentGroups, creditAvg] =
      await Promise.all([
        this.prisma.course.count({ where: { isActive: true } }),
        this.prisma.course.groupBy({
          by: ['level'],
          where: { isActive: true },
          _count: { _all: true },
        }),
        this.prisma.course.groupBy({
          by: ['departmentCode'],
          where: { isActive: true },
          _count: { _all: true },
        }),
        this.prisma.course.aggregate({
          where: { isActive: true },
          _avg: { credits: true },
        }),
      ]);

    const coursesByLevel = Object.fromEntries(
      Object.values(Level).map((l) => [l, 0]),
    ) as Record<Level, number>;

    for (const row of levelGroups) {
      coursesByLevel[row.level] = row._count._all;
    }

    const coursesByDepartment: Record<string, number> = {};
    for (const row of departmentGroups) {
      coursesByDepartment[row.departmentCode] = row._count._all;
    }

    return {
      totalCourses,
      coursesByLevel,
      coursesByDepartment,
      averageCredits: creditAvg._avg.credits ?? 0,
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

  async findUniversityCoursesWithoutSchedules(): Promise<Course[]> {
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) return [];

    return this.prisma.course.findMany({
      where: {
        isActive: true,
        isGeneral: true,
        schedules: { none: { sessionId: activeSession.id } },
      },
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
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });
  }

  async bulkCreateWithValidation(
    courses: Array<{
      code: string;
      name: string;
      level: Level;
      semester: Semester;
      credits: number;
      departmentCode: string;
      lecturerId?: string;
    }>,
  ): Promise<{
    created: Course[];
    errors: Array<{ index: number; error: string }>;
  }> {
    const created: Course[] = [];
    const errors: Array<{ index: number; error: string }> = [];

    const existingCodes = await this.prisma.course
      .findMany({
        where: {
          isActive: true,
          code: { in: courses.map((c) => c.code) },
        },
        select: { code: true },
      })
      .then((rows) => new Set(rows.map((r) => r.code)));

    const deptCodes = [...new Set(courses.map((c) => c.departmentCode))];
    const existingDepts = await this.prisma.department
      .findMany({ where: { code: { in: deptCodes } }, select: { code: true } })
      .then((rows) => new Set(rows.map((r) => r.code)));

    const lecturerIds = [
      ...new Set(
        courses.map((c) => c.lecturerId).filter((id): id is string => !!id),
      ),
    ];
    const existingLecturers = lecturerIds.length
      ? await this.prisma.user
          .findMany({
            where: { id: { in: lecturerIds } },
            select: { id: true },
          })
          .then((rows) => new Set(rows.map((r) => r.id)))
      : new Set<string>();

    for (let i = 0; i < courses.length; i++) {
      const courseData = courses[i];

      if (existingCodes.has(courseData.code)) {
        errors.push({
          index: i,
          error: `Course with code '${courseData.code}' already exists`,
        });
        continue;
      }

      if (!existingDepts.has(courseData.departmentCode)) {
        errors.push({
          index: i,
          error: `Department '${courseData.departmentCode}' does not exist`,
        });
        continue;
      }

      if (
        courseData.lecturerId &&
        !existingLecturers.has(courseData.lecturerId)
      ) {
        errors.push({
          index: i,
          error: `Lecturer with id '${courseData.lecturerId}' does not exist`,
        });
        continue;
      }

      try {
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
        existingCodes.add(courseData.code);
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
