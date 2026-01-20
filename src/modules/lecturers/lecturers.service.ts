import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { BaseService } from '../../common/services/base.service';
import { LecturerRepository } from './repositories/lecturer.repository';
import { Lecturer } from '../../generated/prisma';

@Injectable()
export class LecturersService extends BaseService<
  Lecturer,
  CreateLecturerDto,
  UpdateLecturerDto
> {
  constructor(
    prisma: PrismaService,
    private readonly lecturerRepository: LecturerRepository,
  ) {
    super(prisma, {
      modelName: 'lecturer',
      identifierField: 'id',
      uniqueFields: ['email'],
      softDelete: true,
      includeRelations: { department: true },
      defaultOrderBy: { name: 'asc' },
    });
  }

  async findByDepartment(departmentCode: string): Promise<Lecturer[]> {
    return this.lecturerRepository.findByDepartment(departmentCode);
  }

  async searchByName(searchTerm: string): Promise<Lecturer[]> {
    return this.lecturerRepository.searchByName(searchTerm);
  }

  protected async beforeCreate(
    dto: CreateLecturerDto,
  ): Promise<Record<string, any>> {
    const department = await this.prisma.department.findUnique({
      where: { code: dto.departmentCode },
    });

    if (!department) {
      throw new ConflictException(
        `Department with code '${dto.departmentCode}' does not exist`,
      );
    }
    return dto as Record<string, any>;
  }

  async getDashboardStats(email: string): Promise<{
    totalCourses: number;
    totalSchedules: number;
    coursesByLevel: Record<string, number>;
    schedulesByDay: Record<string, number>;
    upcomingClasses: number;
  }> {
    const lecturer = await this.lecturerRepository.findByEmail(email);
    if (!lecturer) {
      throw new NotFoundException('Lecturer profile not found');
    }

    // Get active academic session
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    const sessionFilter = activeSession ? { sessionId: activeSession.id } : {};

    // Get all courses taught by this lecturer
    const courses = await this.prisma.course.findMany({
      where: {
        lecturerId: lecturer.id,
        isActive: true,
      },
      include: {
        schedules: {
          where: sessionFilter,
        },
      },
    });

    const totalCourses = courses.length;
    const coursesByLevel: Record<string, number> = {};
    const schedulesByDay: Record<string, number> = {};

    courses.forEach((course) => {
      coursesByLevel[course.level] = (coursesByLevel[course.level] || 0) + 1;

      course.schedules.forEach((schedule) => {
        schedulesByDay[schedule.dayOfWeek] =
          (schedulesByDay[schedule.dayOfWeek] || 0) + 1;
      });
    });

    const totalSchedules = courses.reduce(
      (sum, course) => sum + course.schedules.length,
      0,
    );

    const today = new Date();
    const dayOfWeek = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ][today.getDay()];

    const upcomingClasses = courses.reduce((count, course) => {
      return (
        count +
        course.schedules.filter(
          (s) => s.dayOfWeek >= dayOfWeek || s.dayOfWeek === 'MONDAY',
        ).length
      );
    }, 0);

    return {
      totalCourses,
      totalSchedules,
      coursesByLevel,
      schedulesByDay,
      upcomingClasses,
    };
  }

  async getLecturerCourses(email: string) {
    const lecturer = await this.lecturerRepository.findByEmail(email);
    if (!lecturer) {
      throw new NotFoundException('Lecturer profile not found');
    }

    const courses = await this.prisma.course.findMany({
      where: {
        lecturerId: lecturer.id,
        isActive: true,
      },
      include: {
        department: true,
        schedules: {
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });

    return {
      lecturer: {
        id: lecturer.id,
        name: lecturer.name,
        email: lecturer.email,
        departmentCode: lecturer.departmentCode,
      },
      courses,
    };
  }

  async getLecturerSchedule(email: string) {
    const lecturer = await this.lecturerRepository.findByEmail(email);
    if (!lecturer) {
      throw new NotFoundException('Lecturer profile not found');
    }

    // Get active academic session
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    const sessionFilter = activeSession ? { sessionId: activeSession.id } : {};

    const schedules = await this.prisma.schedule.findMany({
      where: {
        course: {
          lecturerId: lecturer.id,
          isActive: true,
        },
        ...sessionFilter,
      },
      include: {
        course: {
          include: {
            department: true,
          },
        },
      },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    // Group schedules by day
    const schedulesByDay: Record<string, any[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };

    schedules.forEach((schedule) => {
      schedulesByDay[schedule.dayOfWeek].push(schedule);
    });

    return {
      lecturer: {
        id: lecturer.id,
        name: lecturer.name,
        email: lecturer.email,
        departmentCode: lecturer.departmentCode,
      },
      activeSession: activeSession
        ? { id: activeSession.id, name: activeSession.name }
        : null,
      schedulesByDay,
      totalSchedules: schedules.length,
    };
  }
}
