import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { BaseService } from '../../common/services/base.service';
import { ExamSchedule, Level, VenueType } from '../../generated/prisma';

const ICT_VENUES: VenueType[] = [
  VenueType.UNIVERSITY_ICT_CENTER,
  VenueType.ICT_LAB_1,
  VenueType.ICT_LAB_2,
  VenueType.COMPUTER_LAB,
];

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
      },
      defaultOrderBy: { date: 'asc' },
    });
  }

  async create(dto: CreateExamDto): Promise<ExamSchedule> {
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      throw new NotFoundException('No active academic session found');
    }

    const course = await this.prisma.course.findUnique({
      where: { code: dto.courseCode },
      include: { department: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${dto.courseCode} not found`);
    }

    // Business Rule: 100L and General courses must use ICT venues (CBT)
    const isCBT = course.level === Level.LEVEL_100 || course.isGeneral;
    const isIctVenue = ICT_VENUES.includes(dto.venue);

    if (isCBT && !isIctVenue) {
      throw new BadRequestException(
        `Course ${course.code} is CBT-based (100L/General). Must use an ICT venue: ${ICT_VENUES.join(', ')}`,
      );
    }

    let examCollege = course.department.college;
    if (course.isGeneral) {
      if (!dto.targetCollege) {
        throw new BadRequestException(
          'Target College required for General Courses',
        );
      }
      examCollege = dto.targetCollege;
    }

    const data = {
      courseCode: dto.courseCode,
      date: new Date(dto.date),
      startTime: dto.startTime,
      endTime: dto.endTime,
      venue: dto.venue,
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
      },
    });
  }
}
