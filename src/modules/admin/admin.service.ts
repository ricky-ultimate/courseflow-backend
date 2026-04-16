import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { DEPARTMENTS_SEED } from './seed-data/departments.seed';
import { UNIVERSITY_COURSES_SEED } from './seed-data/university-courses.seed';
import { DEPARTMENTAL_COURSES_SEED } from './seed-data/departmental-courses.seed';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async deleteAllSchedules(): Promise<{ deleted: number }> {
    const result = await this.prisma.schedule.deleteMany({});
    return { deleted: result.count };
  }

  async deleteAllExamSchedules(): Promise<{ deleted: number }> {
    const result = await this.prisma.examSchedule.deleteMany({});
    return { deleted: result.count };
  }

  async deleteAllCourses(): Promise<{ deleted: number }> {
    await this.prisma.schedule.deleteMany({});
    await this.prisma.examSchedule.deleteMany({});
    await this.prisma.courseAlias.deleteMany({});
    const result = await this.prisma.course.deleteMany({});
    return { deleted: result.count };
  }

  async deleteAllDepartments(): Promise<{ deleted: number }> {
    await this.prisma.schedule.deleteMany({});
    await this.prisma.examSchedule.deleteMany({});
    await this.prisma.courseAlias.deleteMany({});
    await this.prisma.course.deleteMany({});
    const result = await this.prisma.department.deleteMany({});
    return { deleted: result.count };
  }

  async deleteAllData(): Promise<{ deleted: Record<string, number> }> {
    const [schedules, exams, aliases, courses, departments, complaints] =
      await this.prisma.$transaction([
        this.prisma.schedule.deleteMany({}),
        this.prisma.examSchedule.deleteMany({}),
        this.prisma.courseAlias.deleteMany({}),
        this.prisma.course.deleteMany({}),
        this.prisma.department.deleteMany({}),
        this.prisma.complaint.deleteMany({}),
      ]);

    return {
      deleted: {
        schedules: schedules.count,
        examSchedules: exams.count,
        courseAliases: aliases.count,
        courses: courses.count,
        departments: departments.count,
        complaints: complaints.count,
      },
    };
  }

  async seedDepartments(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    for (const dept of DEPARTMENTS_SEED) {
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

  async seedCourses(): Promise<{ created: number; skipped: number }> {
    let created = 0;
    let skipped = 0;

    const allCourses = [
      ...UNIVERSITY_COURSES_SEED,
      ...DEPARTMENTAL_COURSES_SEED,
    ];

    for (const course of allCourses) {
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

  async seedAll(): Promise<{
    departments: { created: number; skipped: number };
    courses: { created: number; skipped: number };
  }> {
    const departments = await this.seedDepartments();
    const courses = await this.seedCourses();
    return { departments, courses };
  }
}
