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
      // Define the default relations to fetch here so BaseService uses them automatically
      includeRelations: {
        course: { include: { department: true } },
        venue: true,
      },
      defaultOrderBy: { date: 'asc' },
    });
  }

  // Override create because of the complex business logic validation
  async create(dto: CreateExamDto): Promise<ExamSchedule> {
    // 1. Get Active Session
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      throw new ConflictException('No active academic session found');
    }

    // 2. Fetch Course
    const course = await this.prisma.course.findUnique({
      where: { code: dto.courseCode },
      include: { department: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${dto.courseCode} not found`);
    }

    // 3. Fetch Venue
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });
    if (!venue) throw new NotFoundException('Venue not found');

    // 4. CBT Rules
    const isCBT = course.level === Level.LEVEL_100 || course.isGeneral;
    if (isCBT && !venue.isIct) {
      throw new BadRequestException(
        `Course ${course.code} is CBT-based (100L/General). Must use an ICT venue.`,
      );
    }

    // 5. Determine College context
    let examCollege = course.department.college;
    if (course.isGeneral) {
      if (!dto.targetCollege)
        throw new BadRequestException(
          'Target College required for General Courses',
        );
      examCollege = dto.targetCollege;
    }

    // 6. Validate Conflicts
    await this.validateVenueConstraints(
      venue,
      dto.date,
      dto.startTime,
      dto.endTime,
      examCollege,
      dto.studentCount,
      activeSession.id,
    );

    // 7. Prepare Data
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
      // Include relations on return so the frontend gets full details immediately
      include: {
        course: { include: { department: true } },
        venue: true,
      },
    });
  }

  // REMOVED: findAll()
  // Reason: BaseService already implements findAll with pagination, sorting,
  // and the includeRelations defined in the constructor.

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

    // Fetch all exams in this venue on this date
    const examsInVenue = await this.prisma.examSchedule.findMany({
      where: {
        venueId: venue.id,
        sessionId,
        date: {
          // Use stricter date comparison to ensure timezone safety
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
      // Check for Time Overlap
      const overlap =
        (startTime >= exam.startTime && startTime < exam.endTime) ||
        (endTime > exam.startTime && endTime <= exam.endTime) ||
        (startTime <= exam.startTime && endTime >= exam.endTime); // Handles case where new exam engulfs old exam

      if (overlap) {
        // Rule: College Separation
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

    // Rule: Capacity Check
    if (currentOccupancy + newStudentCount > venue.capacity) {
      throw new ConflictException(
        `Venue Capacity Exceeded: Current(${currentOccupancy}) + New(${newStudentCount}) > Max(${venue.capacity})`,
      );
    }
  }
}
