import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { BaseService } from '../../common/services/base.service';
import {
  College,
  ExamSchedule,
  Level,
  VenueType,
} from '../../generated/prisma';
import {
  GenerateExamTimetableDto,
  GenerateExamTimetableResult,
} from './dto/generate-exam-timetable.dto';

const ICT_VENUES: VenueType[] = [
  VenueType.UNIVERSITY_ICT_CENTER,
  VenueType.ICT_LAB_1,
  VenueType.ICT_LAB_2,
  VenueType.COMPUTER_LAB,
];

const REGULAR_VENUES: VenueType[] = [
  VenueType.LECTURE_HALL_1,
  VenueType.LECTURE_HALL_2,
  VenueType.LECTURE_HALL_3,
  VenueType.AUDITORIUM_A,
  VenueType.AUDITORIUM_B,
  VenueType.SEMINAR_ROOM_A,
  VenueType.SEMINAR_ROOM_B,
  VenueType.ROOM_101,
  VenueType.ROOM_102,
  VenueType.ROOM_201,
  VenueType.ROOM_202,
  VenueType.ROOM_301,
  VenueType.ROOM_302,
  VenueType.SCIENCE_LAB_1,
  VenueType.SCIENCE_LAB_2,
];

const EXAM_START_TIMES = ['09:00', '12:00', '15:00'];
const EXAM_END_TIMES: Record<string, string> = {
  '09:00': '11:00',
  '12:00': '14:00',
  '15:00': '17:00',
};

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

    const isCBT = course.level === Level.LEVEL_100 || course.isGeneral;
    const isIctVenue = ICT_VENUES.includes(dto.venue);

    if (isCBT && !isIctVenue) {
      throw new BadRequestException(
        `Course ${course.code} is CBT-based (100L/General). Must use an ICT venue: ${ICT_VENUES.join(', ')}`,
      );
    }

    if (course.isGeneral && !dto.targetCollege) {
      throw new BadRequestException(
        'Target College required for General Courses',
      );
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

  async generateExamTimetable(
    dto: GenerateExamTimetableDto,
  ): Promise<GenerateExamTimetableResult> {
    const session = dto.sessionId
      ? await this.prisma.academicSession.findUnique({
          where: { id: dto.sessionId },
        })
      : await this.prisma.academicSession.findFirst({
          where: { isActive: true },
        });

    if (!session) {
      throw new NotFoundException(
        dto.sessionId
          ? `Session '${dto.sessionId}' not found`
          : 'No active academic session found',
      );
    }

    const courseFilter: Record<string, any> = {
      isActive: true,
      semester: dto.semester,
    };

    if (dto.departmentCode) {
      courseFilter.departmentCode = dto.departmentCode;
    }

    if (dto.level) {
      courseFilter.level = dto.level;
    }

    if (dto.college) {
      courseFilter.department = { college: dto.college };
    }

    const courses = await this.prisma.course.findMany({
      where: courseFilter,
      include: { department: true },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });

    if (courses.length === 0) {
      return {
        sessionId: session.id,
        sessionName: session.name,
        semester: dto.semester,
        departmentCode: dto.departmentCode ?? null,
        level: dto.level ?? null,
        college: dto.college ?? null,
        totalCourses: 0,
        scheduledExams: 0,
        skippedCourses: [],
      };
    }

    await this.prisma.examSchedule.deleteMany({
      where: {
        sessionId: session.id,
        semester: dto.semester,
        courseCode: { in: courses.map((c) => c.code) },
      },
    });

    const sessionEnd = new Date(session.endDate);
    const examPeriodStart = new Date(sessionEnd);
    examPeriodStart.setDate(examPeriodStart.getDate() - 21);

    const scheduledExams: Array<{
      courseCode: string;
      date: Date;
      startTime: string;
      endTime: string;
      venue: VenueType;
      studentCount: number;
      targetCollege: College | null;
      semester: typeof dto.semester;
      sessionId: string;
    }> = [];

    const skippedCourses: string[] = [];

    const dateSlotUsage = new Map<string, number>();

    const getDateKey = (date: Date, start: string) =>
      `${date.toISOString().slice(0, 10)}_${start}`;

    for (const course of courses) {
      const isCBT = course.level === Level.LEVEL_100 || course.isGeneral;
      const venuePool = isCBT ? ICT_VENUES : REGULAR_VENUES;

      let assigned = false;

      const searchDate = new Date(examPeriodStart);
      let attempts = 0;
      const maxDays = 21;

      while (attempts < maxDays && !assigned) {
        const dayOfWeek = searchDate.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          for (const startTime of EXAM_START_TIMES) {
            const dateKey = getDateKey(searchDate, startTime);
            const slotsUsed = dateSlotUsage.get(dateKey) ?? 0;

            if (slotsUsed < venuePool.length) {
              const venue = venuePool[slotsUsed % venuePool.length];
              const targetCollege = course.isGeneral
                ? (dto.college ?? course.department.college)
                : null;

              scheduledExams.push({
                courseCode: course.code,
                date: new Date(searchDate),
                startTime,
                endTime: EXAM_END_TIMES[startTime],
                venue,
                studentCount: 50,
                targetCollege,
                semester: dto.semester,
                sessionId: session.id,
              });

              dateSlotUsage.set(dateKey, slotsUsed + 1);
              assigned = true;
              break;
            }
          }
        }

        if (!assigned) {
          searchDate.setDate(searchDate.getDate() + 1);
          attempts++;
        }
      }

      if (!assigned) {
        skippedCourses.push(course.code);
      }
    }

    if (scheduledExams.length > 0) {
      await this.prisma.examSchedule.createMany({
        data: scheduledExams,
        skipDuplicates: true,
      });
    }

    return {
      sessionId: session.id,
      sessionName: session.name,
      semester: dto.semester,
      departmentCode: dto.departmentCode ?? null,
      level: dto.level ?? null,
      college: dto.college ?? null,
      totalCourses: courses.length,
      scheduledExams: scheduledExams.length,
      skippedCourses,
    };
  }
}
