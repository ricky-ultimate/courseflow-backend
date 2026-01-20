import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { College, Course, Venue, Level } from '../../generated/prisma';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExamDto) {
    // 1. Get Active Session
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      throw new ConflictException('No active academic session found');
    }

    // 2. Fetch Course with Department
    const course = await this.prisma.course.findUnique({
      where: { code: dto.courseCode },
      include: { department: true },
    });

    if (!course) {
      throw new NotFoundException(`Course ${dto.courseCode} not found`);
    }

    // 3. Determine College
    let examCollege: College;

    if (course.isGeneral) {
      if (!dto.targetCollege) {
        throw new BadRequestException(
          'Target College is required for General/University courses',
        );
      }
      examCollege = dto.targetCollege;
    } else {
      examCollege = course.department.college;
    }

    // 4. Fetch Venue
    const venue = await this.prisma.venue.findUnique({
      where: { id: dto.venueId },
    });

    if (!venue) {
      throw new NotFoundException('Venue not found');
    }

    // 5. Rule: 100L or General Courses MUST be in ICT Center (CBT)
    const isCBT = course.level === Level.LEVEL_100 || course.isGeneral;
    if (isCBT && !venue.isIct) {
      throw new BadRequestException(
        `Course ${course.code} is CBT-based (100L/General). Must use an ICT venue.`,
      );
    }
    // Also enforcing that non-CBT courses shouldn't hog the ICT center (optional, but good practice)
    if (!isCBT && venue.isIct) {
        // Warning or allow? Let's allow for flexibility, but usually strictly separate.
    }

    // 6. Validate Time & Capacity Constraints
    await this.validateVenueConstraints(
      venue,
      dto.date,
      dto.startTime,
      dto.endTime,
      examCollege,
      dto.studentCount,
      activeSession.id,
    );

    // 7. Create Exam
    return this.prisma.examSchedule.create({
      data: {
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

    // Fetch all exams in this venue on this date
    const examsInVenue = await this.prisma.examSchedule.findMany({
      where: {
        venueId: venue.id,
        sessionId,
        date: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lt: new Date(date.setHours(23, 59, 59, 999)),
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
        (startTime <= exam.startTime && endTime >= exam.endTime);

      if (overlap) {
        // Rule: College Separation (CBAS and CHMS cannot mix in the same hall)
        const existingExamCollege = exam.targetCollege ?? exam.course.department.college;

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

  async findAll() {
    return this.prisma.examSchedule.findMany({
      include: {
        course: true,
        venue: true,
      },
      orderBy: { date: 'asc' },
    });
  }
}
