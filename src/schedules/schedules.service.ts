import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BaseService } from '../common/services/base.service';
import { CsvService } from '../common/services/csv.service';
import { ScheduleRepository } from './repositories/schedule.repository';
import {
  ScheduleCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../common/dto/csv-bulk.dto';
import { Schedule, Level, DayOfWeek, ClassType } from '../generated/prisma';

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
      includeRelations: { course: { include: { department: true } } },
      defaultOrderBy: { startTime: 'asc' },
    });
  }

  async findByCourse(courseCode: string): Promise<Schedule[]> {
    return this.scheduleRepository.findByCourse(courseCode);
  }

  async findByDepartment(departmentCode: string): Promise<Schedule[]> {
    return this.scheduleRepository.findByDepartment(departmentCode);
  }

  async findByLevel(level: Level): Promise<Schedule[]> {
    return this.scheduleRepository.findByLevel(level);
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

    // Parse and validate CSV structure
    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      ScheduleCsvRowDto,
      requiredHeaders,
    );

    const allErrors: CsvValidationError[] = [...errors];

    if (data.length === 0) {
      return this.csvService.createBulkResult([], allErrors, errors.length);
    }

    // Additional CSV-specific validations
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

      // Validate time range
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

      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { code: scheduleData.courseCode },
      });

      if (!course) {
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

    // If there are validation errors, return early
    if (allErrors.length > 0) {
      return this.csvService.createBulkResult(
        [],
        allErrors,
        data.length + errors.length,
      );
    }

    // Use repository bulk creation with conflict validation
    const { created, conflicts } =
      await this.scheduleRepository.bulkCreateWithValidation(
        validatedSchedules,
      );

    // Convert conflicts to CSV validation errors
    for (const conflict of conflicts) {
      const rowNumber = conflict.index + 2; // +2 for CSV header
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

  // Additional repository-based methods
  async findByDayOfWeek(dayOfWeek: DayOfWeek): Promise<Schedule[]> {
    return this.scheduleRepository.findByDayOfWeek(dayOfWeek);
  }

  async findByVenue(venue: string): Promise<Schedule[]> {
    return this.scheduleRepository.findByVenue(venue);
  }

  async findByClassType(type: ClassType): Promise<Schedule[]> {
    return this.scheduleRepository.findByClassType(type);
  }

  async findByTimeRange(
    startTime: string,
    endTime: string,
    dayOfWeek?: DayOfWeek,
  ): Promise<Schedule[]> {
    return this.scheduleRepository.findByTimeRange(
      startTime,
      endTime,
      dayOfWeek,
    );
  }

  async getScheduleStatistics(): Promise<{
    totalSchedules: number;
    schedulesByDay: Record<string, number>;
    schedulesByType: Record<string, number>;
  }> {
    return this.scheduleRepository.getScheduleStats();
  }

  async checkScheduleConflict(
    courseCode: string,
    dayOfWeek: DayOfWeek,
    startTime: string,
    endTime: string,
    excludeId?: string,
  ): Promise<Schedule | null> {
    return this.scheduleRepository.findScheduleConflict(
      courseCode,
      dayOfWeek,
      startTime,
      endTime,
      excludeId,
    );
  }
}
