import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BaseService } from '../common/services/base.service';
import { Schedule, Level } from '../generated/prisma';

@Injectable()
export class SchedulesService extends BaseService<
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'schedule',
      identifierField: 'id',
      includeRelations: { course: { include: { department: true } } },
      defaultOrderBy: { startTime: 'asc' },
    });
  }

  async findByCourse(courseCode: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { courseCode },
      include: { course: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByDepartment(departmentCode: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { course: { departmentCode } },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByLevel(level: Level): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { course: { level } },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }
}
