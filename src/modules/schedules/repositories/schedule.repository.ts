import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Schedule,
  DayOfWeek,
  Semester,
  VenueType,
} from '../../../generated/prisma';

@Injectable()
export class ScheduleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findScheduleConflict(
    courseCode: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    sessionId?: string,
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

    if (sessionId) {
      whereClause.sessionId = sessionId;
    }

    if (excludeId) {
      whereClause.id = { not: excludeId };
    }

    return this.prisma.schedule.findFirst({
      where: whereClause,
    });
  }

  async getScheduleStats(): Promise<{
    totalSchedules: number;
    schedulesByDay: Record<DayOfWeek, number>;
  }> {
    const totalSchedules = await this.prisma.schedule.count();

    const schedulesByDay = {} as Record<DayOfWeek, number>;
    for (const day of Object.values(DayOfWeek)) {
      schedulesByDay[day] = await this.prisma.schedule.count({
        where: { dayOfWeek: day },
      });
    }

    return {
      totalSchedules,
      schedulesByDay,
    };
  }

  async bulkCreateWithValidation(
    schedules: Array<{
      courseCode: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      venue: VenueType;
      sessionId: string;
      semester: Semester;
    }>,
  ): Promise<{
    created: Schedule[];
    conflicts: Array<{ index: number; conflict: Schedule }>;
  }> {
    const created: Schedule[] = [];
    const conflicts: Array<{ index: number; conflict: Schedule }> = [];

    for (let i = 0; i < schedules.length; i++) {
      const scheduleData = schedules[i];

      const conflict = await this.findScheduleConflict(
        scheduleData.courseCode,
        scheduleData.dayOfWeek,
        scheduleData.startTime,
        scheduleData.endTime,
        scheduleData.sessionId,
      );

      if (conflict) {
        conflicts.push({ index: i, conflict });
      } else {
        const newSchedule = await this.prisma.schedule.create({
          data: scheduleData,
          include: {
            course: {
              include: {
                department: true,
                lecturer: true,
              },
            },
          },
        });
        created.push(newSchedule);
      }
    }

    return { created, conflicts };
  }
}
