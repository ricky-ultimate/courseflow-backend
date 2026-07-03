import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DEPARTMENTS_SEED } from './seed-data/departments.seed';
import { UNIVERSITY_COURSES_SEED } from './seed-data/university-courses.seed';
import { College, Level, Semester } from '../../generated/prisma';

interface SeedCourse {
  code: string;
  name: string;
  level: Level;
  credits: number;
  semester: Semester;
  departmentCode: string;
  isGeneral: boolean;
  isLocked: boolean;
}

interface SeedDepartment {
  name: string;
  code: string;
  college: College;
  description?: string;
}

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteAllSchedules(
    collegeScope?: College,
  ): Promise<{ deleted: number }> {
    if (!collegeScope) {
      const result = await this.prisma.schedule.deleteMany({});
      return { deleted: result.count };
    }

    const result = await this.prisma.schedule.deleteMany({
      where: { course: { department: { college: collegeScope } } },
    });
    return { deleted: result.count };
  }

  async deleteAllExamSchedules(
    collegeScope?: College,
  ): Promise<{ deleted: number }> {
    if (!collegeScope) {
      const result = await this.prisma.examSchedule.deleteMany({});
      return { deleted: result.count };
    }

    const result = await this.prisma.examSchedule.deleteMany({
      where: { course: { department: { college: collegeScope } } },
    });
    return { deleted: result.count };
  }

  async deleteAllCourses(collegeScope?: College): Promise<{ deleted: number }> {
    if (!collegeScope) {
      await this.prisma.schedule.deleteMany({});
      await this.prisma.examSchedule.deleteMany({});
      await this.prisma.courseAlias.deleteMany({});
      const result = await this.prisma.course.deleteMany({});
      return { deleted: result.count };
    }

    const depts = await this.prisma.department.findMany({
      where: { college: collegeScope },
      select: { code: true },
    });
    const deptCodes = depts.map((d) => d.code);

    await this.prisma.schedule.deleteMany({
      where: { course: { departmentCode: { in: deptCodes } } },
    });
    await this.prisma.examSchedule.deleteMany({
      where: { course: { departmentCode: { in: deptCodes } } },
    });

    const courseCodes = (
      await this.prisma.course.findMany({
        where: { departmentCode: { in: deptCodes } },
        select: { code: true },
      })
    ).map((c) => c.code);

    await this.prisma.courseAlias.deleteMany({
      where: {
        OR: [
          { primaryCode: { in: courseCodes } },
          { aliasCode: { in: courseCodes } },
        ],
      },
    });

    const result = await this.prisma.course.deleteMany({
      where: { departmentCode: { in: deptCodes } },
    });
    return { deleted: result.count };
  }

  async deleteAllDepartments(
    collegeScope?: College,
  ): Promise<{ deleted: number }> {
    if (!collegeScope) {
      await this.prisma.schedule.deleteMany({});
      await this.prisma.examSchedule.deleteMany({});
      await this.prisma.courseAlias.deleteMany({});
      await this.prisma.course.deleteMany({});
      const result = await this.prisma.department.deleteMany({});
      return { deleted: result.count };
    }

    await this.deleteAllCourses(collegeScope);
    const result = await this.prisma.department.deleteMany({
      where: { college: collegeScope },
    });
    return { deleted: result.count };
  }

  async deleteAllData(): Promise<{ deleted: Record<string, number> }> {
    const [schedules, exams, aliases, courses, departments, complaints, users] =
      await this.prisma.$transaction([
        this.prisma.schedule.deleteMany({}),
        this.prisma.examSchedule.deleteMany({}),
        this.prisma.courseAlias.deleteMany({}),
        this.prisma.course.deleteMany({}),
        this.prisma.department.deleteMany({}),
        this.prisma.complaint.deleteMany({}),
        this.prisma.user.deleteMany({
          where: {
            role: {
              notIn: ['ADMIN', 'COLLEGE_ADMIN'],
            },
          },
        }),
      ]);

    return {
      deleted: {
        schedules: schedules.count,
        examSchedules: exams.count,
        courseAliases: aliases.count,
        courses: courses.count,
        departments: departments.count,
        complaints: complaints.count,
        nonAdminUsers: users.count,
      },
    };
  }

  async deleteAllSchedulesExceptGeneral(
    collegeScope?: College,
  ): Promise<{ deleted: number }> {
    if (!collegeScope) {
      const result = await this.prisma.schedule.deleteMany({
        where: {
          course: {
            isGeneral: false,
          },
        },
      });
      return { deleted: result.count };
    }

    const result = await this.prisma.schedule.deleteMany({
      where: {
        course: {
          department: { college: collegeScope },
          isGeneral: false,
        },
      },
    });
    return { deleted: result.count };
  }

  async seedDepartments(
    collegeScope?: College,
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    const depts: SeedDepartment[] = collegeScope
      ? DEPARTMENTS_SEED.filter((d) => d.college === collegeScope)
      : DEPARTMENTS_SEED;

    for (const dept of depts) {
      const existing = await this.prisma.department.findUnique({
        where: { code: dept.code },
      });
      if (existing) {
        skipped++;
        continue;
      }
      await this.prisma.department.create({ data: dept });
      created++;
    }

    return { created, skipped };
  }

  async seedCourses(
    collegeScope?: College,
  ): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    if (collegeScope) {
      return { created, skipped };
    }

    for (const course of UNIVERSITY_COURSES_SEED as SeedCourse[]) {
      const existing = await this.prisma.course.findUnique({
        where: { code: course.code },
      });
      if (existing) {
        skipped++;
        continue;
      }

      const dept = await this.prisma.department.findUnique({
        where: { code: course.departmentCode },
      });
      if (!dept) {
        skipped++;
        continue;
      }

      await this.prisma.course.create({ data: course });
      created++;
    }

    return { created, skipped };
  }

  async seedAll(collegeScope?: College): Promise<{
    departments: { created: number; skipped: number };
    courses: { created: number; skipped: number };
  }> {
    const departments = await this.seedDepartments(collegeScope);
    const courses = await this.seedCourses(collegeScope);
    return { departments, courses };
  }
}
