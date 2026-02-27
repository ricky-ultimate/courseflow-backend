import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleFilterDto } from './dto/schedule-filter.dto';
import { BaseService } from '../../common/services/base.service';
import { CsvService } from '../../common/services/csv.service';
import { ScheduleRepository } from './repositories/schedule.repository';
import {
  ScheduleCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../../common/dto/csv-bulk.dto';
import {
  Schedule,
  Semester,
  DayOfWeek,
  VenueType,
} from '../../generated/prisma';
import { PaginatedResult } from '../../common/interfaces/base-service.interface';

@Injectable()
export class SchedulesService extends BaseService<
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto
> {
  constructor(
    prisma: PrismaService,
    private readonly csvService: CsvService,
    private readonly scheduleRepository: ScheduleRepository,
  ) {
    super(prisma, {
      modelName: 'schedule',
      identifierField: 'id',
      includeRelations: {
        course: {
          include: {
            department: true,
            lecturer: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                departmentCode: true,
              },
            },
          },
        },
      },
      defaultOrderBy: { startTime: 'asc' },
    });
  }

  protected async beforeCreate(
    dto: CreateScheduleDto,
  ): Promise<Record<string, any>> {
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      throw new ConflictException('No active academic session found');
    }

    const course = await this.prisma.course.findUnique({
      where: { code: dto.courseCode },
      select: { semester: true },
    });

    if (!course) {
      throw new NotFoundException(
        `Course with code '${dto.courseCode}' not found`,
      );
    }

    return {
      ...dto,
      sessionId: activeSession.id,
      semester: course.semester,
    };
  }

  async findAll(
    query: ScheduleFilterDto = {},
  ): Promise<Schedule[] | PaginatedResult<Schedule>> {
    const where: Record<string, any> = { ...this.getActiveFilter() };

    if (query.semester) {
      where.semester = query.semester;
    }

    if (query.sessionId) {
      where.sessionId = query.sessionId;
    } else {
      const activeSession = await this.prisma.academicSession.findFirst({
        where: { isActive: true },
      });
      if (activeSession) {
        where.sessionId = activeSession.id;
      }
    }

    const courseFilter: Record<string, any> = {};
    if (query.departmentCode) {
      courseFilter.departmentCode = query.departmentCode;
    }
    if (query.level) {
      courseFilter.level = query.level;
    }
    if (Object.keys(courseFilter).length > 0) {
      where.course = courseFilter;
    }
    if (query.courseCode) {
      where.courseCode = query.courseCode;
    }

    if (query.dayOfWeek) {
      where.dayOfWeek = query.dayOfWeek;
    }

    if (query.venue) {
      where.venue = { contains: query.venue, mode: 'insensitive' };
    }
    if (query.startTime || query.endTime) {
      const timeFilter: Record<string, any>[] = [];
      if (query.startTime && query.endTime) {
        timeFilter.push(
          {
            AND: [
              { startTime: { gte: query.startTime } },
              { startTime: { lt: query.endTime } },
            ],
          },
          {
            AND: [
              { endTime: { gt: query.startTime } },
              { endTime: { lte: query.endTime } },
            ],
          },
          {
            AND: [
              { startTime: { lte: query.startTime } },
              { endTime: { gte: query.endTime } },
            ],
          },
        );
        where.OR = timeFilter;
      } else if (query.startTime) {
        where.startTime = { gte: query.startTime };
      } else if (query.endTime) {
        where.endTime = { lte: query.endTime };
      }
    }
    if (query.page && query.limit) {
      return this.findPaginated(where, query);
    }

    return this.getModel().findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(query),
    }) as Promise<Schedule[]>;
  }

  async bulkCreateFromCsv(
    buffer: Buffer,
  ): Promise<BulkOperationResult<Schedule>> {
    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    if (!activeSession) {
      throw new ConflictException(
        'No active academic session found. Please activate a session first.',
      );
    }

    const requiredHeaders = [
      'courseCode',
      'dayOfWeek',
      'startTime',
      'endTime',
      'venue',
    ];

    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      ScheduleCsvRowDto,
      requiredHeaders,
    );

    const allErrors: CsvValidationError[] = [...errors];

    if (data.length === 0) {
      return this.csvService.createBulkResult([], allErrors, errors.length);
    }

    const courseCodes = [...new Set(data.map((d) => d.courseCode))];
    const courses = await this.prisma.course.findMany({
      where: { code: { in: courseCodes } },
      select: { code: true, semester: true },
    });
    const courseMap = new Map(courses.map((c) => [c.code, c.semester]));

    const validatedSchedules: Array<{
      courseCode: string;
      dayOfWeek: DayOfWeek;
      startTime: string;
      endTime: string;
      venue: VenueType;
      sessionId: string;
      semester: Semester;
    }> = [];

    for (let i = 0; i < data.length; i++) {
      const scheduleData = data[i];
      const rowNumber = i + 2;

      if (
        !this.csvService.validateTimeRange(
          scheduleData.startTime,
          scheduleData.endTime,
        )
      ) {
        allErrors.push({
          row: rowNumber,
          field: 'endTime',
          value: scheduleData.endTime,
          message: 'End time must be after start time',
        });
        continue;
      }

      const courseSemester = courseMap.get(scheduleData.courseCode);

      if (!courseSemester) {
        allErrors.push({
          row: rowNumber,
          field: 'courseCode',
          value: scheduleData.courseCode,
          message: `Course with code '${scheduleData.courseCode}' does not exist`,
        });
        continue;
      }

      validatedSchedules.push({
        courseCode: scheduleData.courseCode,
        dayOfWeek: scheduleData.dayOfWeek,
        startTime: scheduleData.startTime,
        endTime: scheduleData.endTime,
        venue: scheduleData.venue,
        sessionId: activeSession.id,
        semester: courseSemester,
      });
    }

    if (allErrors.length > 0) {
      return this.csvService.createBulkResult(
        [],
        allErrors,
        data.length + errors.length,
      );
    }

    const { created, conflicts } =
      await this.scheduleRepository.bulkCreateWithValidation(
        validatedSchedules,
      );

    for (const conflict of conflicts) {
      const rowNumber = conflict.index + 2;
      allErrors.push({
        row: rowNumber,
        field: 'general',
        value: validatedSchedules[conflict.index],
        message: `Schedule conflict: Course already has a class at overlapping time`,
      });
    }

    return this.csvService.createBulkResult(
      created,
      allErrors,
      data.length + errors.length,
    );
  }

  generateCsvTemplate(): string {
    const headers = [
      'courseCode',
      'dayOfWeek',
      'startTime',
      'endTime',
      'venue',
    ];
    const sampleData = {
      courseCode: 'CS101',
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '09:30',
      venue: 'Room 101',
    };

    return this.csvService.generateCsvTemplate(headers, sampleData);
  }

  async getScheduleStatistics(): Promise<{
    totalSchedules: number;
    schedulesByDay: Record<string, number>;
  }> {
    return this.scheduleRepository.getScheduleStats();
  }
}
