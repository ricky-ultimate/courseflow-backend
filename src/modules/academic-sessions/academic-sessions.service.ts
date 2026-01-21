import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
import { BaseService } from '../../common/services/base.service';
import { AcademicSession } from '../../generated/prisma';

@Injectable()
export class AcademicSessionsService extends BaseService<
  AcademicSession,
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'academicSession',
      identifierField: 'id',
      uniqueFields: ['name'],
      defaultOrderBy: { startDate: 'desc' },
    });
  }

  protected async beforeCreate(
    dto: CreateAcademicSessionDto,
  ): Promise<Record<string, any>> {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    return {
      name: dto.name,
      startDate,
      endDate,
      isActive: false,
    };
  }

  protected async beforeUpdate(
    dto: UpdateAcademicSessionDto,
    identifier: string,
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = { ...dto };

    if (dto.startDate) {
      data.startDate = new Date(dto.startDate);
    }

    if (dto.endDate) {
      data.endDate = new Date(dto.endDate);
    }

    // If setting this session as active, deactivate all others
    if (dto.isActive === true) {
      await this.prisma.academicSession.updateMany({
        where: {
          id: { not: identifier },
          isActive: true,
        },
        data: { isActive: false },
      });
    }

    return data;
  }

  async getActiveSession(): Promise<AcademicSession | null> {
    return this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });
  }

  async setActiveSession(id: string): Promise<AcademicSession> {
    // Deactivate all sessions
    await this.prisma.academicSession.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the specified session
    return this.prisma.academicSession.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async archiveSession(id: string): Promise<AcademicSession> {
    const session = await this.findOne(id);

    if (!session.isActive) {
      throw new ConflictException('Session is already archived');
    }

    return this.prisma.academicSession.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async getSessionStatistics(id: string): Promise<{
    totalSchedules: number;
    totalExams: number;
    schedulesBySemester: { FIRST: number; SECOND: number };
    examsBySemester: { FIRST: number; SECOND: number };
  }> {
    const [schedules, exams] = await Promise.all([
      this.prisma.schedule.findMany({
        where: { sessionId: id },
        select: { semester: true },
      }),
      this.prisma.examSchedule.findMany({
        where: { sessionId: id },
        select: { semester: true },
      }),
    ]);

    return {
      totalSchedules: schedules.length,
      totalExams: exams.length,
      schedulesBySemester: {
        FIRST: schedules.filter((s) => s.semester === 'FIRST').length,
        SECOND: schedules.filter((s) => s.semester === 'SECOND').length,
      },
      examsBySemester: {
        FIRST: exams.filter((e) => e.semester === 'FIRST').length,
        SECOND: exams.filter((e) => e.semester === 'SECOND').length,
      },
    };
  }
}
