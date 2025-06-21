import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Schedule, Level, DayOfWeek, ClassType } from '../../generated/prisma';

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Find schedules by course code
   */
  async findByCourse(courseCode: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { courseCode },
      include: { course: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Find schedules by department code
   */
  async findByDepartment(departmentCode: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { course: { departmentCode } },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Find schedules by academic level
   */
  async findByLevel(level: Level): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { course: { level } },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Check for schedule conflicts
   */
  async findScheduleConflict(
    courseCode: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<Schedule | null> {
    const whereClause: Record<string, unknown> = {
      courseCode,
      dayOfWeek,
      OR: [
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gt: startTime } },
          ],
        },
        {
          AND: [{ startTime: { lt: endTime } }, { endTime: { gte: endTime } }],
        },
        {
          AND: [
            { startTime: { gte: startTime } },
            { endTime: { lte: endTime } },
          ],
        },
      ],
    };

    // Exclude specific schedule ID if provided (useful for updates)
    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    return this.prisma.schedule.findFirst({
      where: whereClause,
    });
  }

  /**
   * Find schedules by day of week
   */
  async findByDayOfWeek(dayOfWeek: DayOfWeek): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { dayOfWeek },
      include: { course: { include: { department: true } } },
      orderBy: [{ startTime: 'asc' }, { courseCode: 'asc' }],
    });
  }

  /**
   * Find schedules by venue
   */
  async findByVenue(venue: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { venue: { contains: venue, mode: 'insensitive' } },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Find schedules by class type
   */
  async findByClassType(type: ClassType): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { type },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Find schedules within a time range
   */
  async findByTimeRange(
    startTime: string,
    endTime: string,
    dayOfWeek?: DayOfWeek,
  ): Promise<Schedule[]> {
    const whereClause: Record<string, unknown> = {
      OR: [
        {
          AND: [
            { startTime: { gte: startTime } },
            { startTime: { lt: endTime } },
          ],
        },
        {
          AND: [{ endTime: { gt: startTime } }, { endTime: { lte: endTime } }],
        },
        {
          AND: [
            { startTime: { lte: startTime } },
            { endTime: { gte: endTime } },
          ],
        },
      ],
    };

    if (dayOfWeek) {
      whereClause.dayOfWeek = dayOfWeek;
    }

    return this.prisma.schedule.findMany({
      where: whereClause,
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  /**
   * Get schedule statistics
   */
  async getScheduleStats(): Promise<{
    totalSchedules: number;
    schedulesByDay: Record<DayOfWeek, number>;
    schedulesByType: Record<ClassType, number>;
  }> {
    const totalSchedules = await this.prisma.schedule.count();

    // Get schedules by day
    const schedulesByDay = {} as Record<DayOfWeek, number>;
    for (const day of Object.values(DayOfWeek)) {
      schedulesByDay[day] = await this.prisma.schedule.count({
        where: { dayOfWeek: day },
      });
    }

    // Get schedules by type
    const schedulesByType = {} as Record<ClassType, number>;
    for (const type of Object.values(ClassType)) {
      schedulesByType[type] = await this.prisma.schedule.count({
        where: { type },
      });
    }

    return {
      totalSchedules,
      schedulesByDay,
      schedulesByType,
    };
  }

  /**
   * Bulk create schedules with conflict checking
   */
  async bulkCreateWithValidation(
    schedules: Array<{
      courseCode: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      venue: string;
      type?: ClassType;
    }>,
  ): Promise<{
    created: Schedule[];
    conflicts: Array<{ index: number; conflict: Schedule }>;
  }> {
    const created: Schedule[] = [];
    const conflicts: Array<{ index: number; conflict: Schedule }> = [];

    for (let i = 0; i < schedules.length; i++) {
      const scheduleData = schedules[i];

      // Check for conflicts
      const conflict = await this.findScheduleConflict(
        scheduleData.courseCode,
        scheduleData.dayOfWeek,
        scheduleData.startTime,
        scheduleData.endTime,
      );

      if (conflict) {
        conflicts.push({ index: i, conflict });
      } else {
        const newSchedule = await this.prisma.schedule.create({
          data: {
            ...scheduleData,
            type: scheduleData.type || ClassType.LECTURE,
          },
          include: {
            course: {
              include: { department: true },
            },
          },
        });
        created.push(newSchedule);
      }
    }

    return { created, conflicts };
  }
}
