import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { BaseService } from '../../common/services/base.service';
import { AcademicSession } from '../../generated/prisma';

@Injectable()
export class SessionsService extends BaseService<
  AcademicSession,
  CreateSessionDto,
  UpdateSessionDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'academicSession',
      identifierField: 'id',
      uniqueFields: ['name'],
      defaultOrderBy: { name: 'desc' },
    });
  }

  async getActiveSession(): Promise<AcademicSession | null> {
    return this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });
  }

  async setActiveSession(id: string): Promise<AcademicSession> {
    const session = await this.findOne(id);

    // Deactivate all other sessions
    await this.prisma.academicSession.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Activate the selected session
    return this.prisma.academicSession.update({
      where: { id },
      data: { isActive: true },
    });
  }

  async startNewSession(name: string): Promise<AcademicSession> {
    // Check if session already exists
    const existing = await this.prisma.academicSession.findUnique({
      where: { name },
    });

    if (existing) {
      throw new ConflictException(`Academic session '${name}' already exists`);
    }

    // Deactivate all current sessions
    await this.prisma.academicSession.updateMany({
      where: { isActive: true },
      data: { isActive: false },
    });

    // Create and activate new session
    return this.prisma.academicSession.create({
      data: {
        name,
        isActive: true,
      },
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
    session: AcademicSession;
    totalSchedules: number;
    totalExams: number;
    schedulesBySemester: {
      FIRST: number;
      SECOND: number;
    };
  }> {
    const session = await this.findOne(id);

    const [totalSchedules, totalExams, firstSemesterCount, secondSemesterCount] =
      await Promise.all([
        this.prisma.schedule.count({ where: { sessionId: id } }),
        this.prisma.examSchedule.count({ where: { sessionId: id } }),
        this.prisma.schedule.count({
          where: { sessionId: id, semester: 'FIRST' },
        }),
        this.prisma.schedule.count({
          where: { sessionId: id, semester: 'SECOND' },
        }),
      ]);

    return {
      session,
      totalSchedules,
      totalExams,
      schedulesBySemester: {
        FIRST: firstSemesterCount,
        SECOND: secondSemesterCount,
      },
    };
  }
}
