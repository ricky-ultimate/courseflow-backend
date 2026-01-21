import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { BaseService } from '../../common/services/base.service';
import { ExamSchedule, College, Level, Venue } from '../../generated/prisma';

@Injectable()
export class ExamsService extends BaseService<
  ExamSchedule,
  CreateExamDto,
  UpdateExamDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'examSchedule',
      identifierField: 'id',
      includeRelations: {
        course: { include: { department: true } },
        venue: true,
      },
      defaultOrderBy: { date: 'asc' },
    });
  }

  async create(dto: CreateExamDto): Promise<ExamSchedule> {
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      throw new ConflictException('No active academic session found');
    }

    const course = await this.prisma.course.findUnique({
      where: { code: dto.courseCode },
      include: { department: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${dto.courseCode} not found`);
    }

    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });
    if (!venue) throw new NotFoundException('Venue not found');

    const isCBT = course.level === Level.LEVEL_100 || course.isGeneral;
    if (isCBT && !venue.isIct) {
      throw new BadRequestException(
        `Course ${course.code} is CBT-based (100L/General). Must use an ICT venue.`,
      );
    }

    let examCollege = course.department.college;
    if (course.isGeneral) {
      if (!dto.targetCollege)
        throw new BadRequestException(
          'Target College required for General Courses',
        );
      examCollege = dto.targetCollege;
    }

    await this.validateVenueConstraints(
      venue,
      dto.date,
      dto.startTime,
      dto.endTime,
      examCollege,
      dto.studentCount,
      activeSession.id,
    );

    const data = {
      courseCode: dto.courseCode,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      venueId: dto.venueId,
      studentCount: dto.studentCount,
      targetCollege: course.isGeneral ? dto.targetCollege : null,
      invigilators: dto.invigilators,
      semester: course.semester,
      sessionId: activeSession.id,
    };

    return this.prisma.examSchedule.create({
      data,
      include: {
        course: { include: { department: true } },
        venue: true,
      },
    });
  }

  private async validateVenueConstraints(
    venue: Venue,
    dateString: string,
    startTime: string,
    endTime: string,
    newExamCollege: College,
    newStudentCount: number,
    sessionId: string,
  ) {
    const date = new Date(dateString);

    const examsInVenue = await this.prisma.examSchedule.findMany({
      where: {
        venueId: venue.id,
        sessionId,
        date: {
          gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
          lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
        },
      },
      include: {
        course: {
          include: { department: true },
        },
      },
    });

    let currentOccupancy = 0;

    for (const exam of examsInVenue) {
      const overlap =
        (startTime >= exam.startTime && startTime < exam.endTime) ||
        (endTime > exam.startTime && endTime <= exam.endTime) ||
        (startTime <= exam.startTime && endTime >= exam.endTime);

      if (overlap) {
        const existingExamCollege =
          exam.targetCollege ?? exam.course.department.college;

        if (existingExamCollege !== newExamCollege) {
          throw new ConflictException(
            `College Conflict: Venue occupied by ${existingExamCollege} (${exam.courseCode}). Cannot schedule ${newExamCollege} exam here at the same time.`,
          );
        }

        currentOccupancy += exam.studentCount;
      }
    }

    if (currentOccupancy + newStudentCount > venue.capacity) {
      throw new ConflictException(
        `Venue Capacity Exceeded: Current(${currentOccupancy}) + New(${newStudentCount}) > Max(${venue.capacity})`,
      );
    }
  }
}
