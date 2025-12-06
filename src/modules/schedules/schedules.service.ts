import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleFilterDto } from './dto/schedule-filter.dto';
import { BaseService } from '../../common/services/base.service';
import { CsvService } from '../../common/services/csv.service';
import { ScheduleRepository } from './repositories/schedule.repository';
import { CourseRepository } from '../courses/repositories/course.repository';
import {
  ScheduleCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../../common/dto/csv-bulk.dto';
import { Schedule, Level, DayOfWeek, ClassType } from '../../generated/prisma';
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
    private readonly courseRepository: CourseRepository,
  ) {
    super(prisma, {
      modelName: 'schedule',
      identifierField: 'id',
      // Updated to include lecturer through course relation
      includeRelations: {
        course: {
          include: {
            department: true,
            lecturer: true  // Added lecturer relation
          }
        }
      },
      defaultOrderBy: { startTime: 'asc' },
    });
  }

  async findAll(
    query: ScheduleFilterDto = {},
  ): Promise<Schedule[] | PaginatedResult<Schedule>> {
    const where: Record<string, any> = { ...this.getActiveFilter() };

    // Relation filters
    const courseFilter: Record<string, any> = {};
    if (query.departmentCode) {
      courseFilter.departmentCode = query.departmentCode;
    }
    if (query.level) {
      courseFilter.level = query.level;
    }
    // Only add course relation filter if fields are present
    if (Object.keys(courseFilter).length > 0) {
      where.course = courseFilter;
    }

    // Direct filters
    if (query.courseCode) {
      where.courseCode = query.courseCode;
    }

    if (query.dayOfWeek) {
      where.dayOfWeek = query.dayOfWeek;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.venue) {
      where.venue = { contains: query.venue, mode: 'insensitive' };
    }

    // Time filtering
    if (query.startTime || query.endTime) {
      const timeFilter: Record<string, any>[] = [];
      if (query.startTime && query.endTime) {
        // Range overlap logic
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

    // Pagination
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

    const validatedSchedules: Array<{
      courseCode: string;
      dayOfWeek: any;
      startTime: string;
      endTime: string;
      venue: string;
      type?: any;
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

      const courseExists = await this.courseRepository.existsByCode(
        scheduleData.courseCode,
      );

      if (!courseExists) {
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
        type: scheduleData.type || 'LECTURE',
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
      'type',
    ];
    const sampleData = {
      courseCode: 'CS101',
      dayOfWeek: 'MONDAY',
      startTime: '08:00',
      endTime: '09:30',
      venue: 'Room 101',
      type: 'LECTURE',
    };

    return this.csvService.generateCsvTemplate(headers, sampleData);
  }

  async getScheduleStatistics(): Promise<{
    totalSchedules: number;
    schedulesByDay: Record<string, number>;
    schedulesByType: Record<string, number>;
  }> {
    return this.scheduleRepository.getScheduleStats();
  }
}
