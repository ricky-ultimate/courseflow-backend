import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BaseService } from '../common/services/base.service';
import { CsvService } from '../common/services/csv.service';
import {
  ScheduleCsvRowDto,
  BulkOperationResult,
  CsvValidationError,
} from '../common/dto/csv-bulk.dto';
import { Schedule, Level } from '../generated/prisma';

@Injectable()
export class SchedulesService extends BaseService<
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto
> {
  constructor(
    prisma: PrismaService,
    private readonly csvService: CsvService,
  ) {
    super(prisma, {
      modelName: 'schedule',
      identifierField: 'id',
      includeRelations: { course: { include: { department: true } } },
      defaultOrderBy: { startTime: 'asc' },
    });
  }

  async findByCourse(courseCode: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { courseCode },
      include: { course: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByDepartment(departmentCode: string): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { course: { departmentCode } },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
  }

  async findByLevel(level: Level): Promise<Schedule[]> {
    return this.prisma.schedule.findMany({
      where: { course: { level } },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
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

    // Parse and validate CSV
    const { data, errors } = await this.csvService.parseCsvFile(
      buffer,
      ScheduleCsvRowDto,
      requiredHeaders,
    );

    const created: Schedule[] = [];
    const allErrors: CsvValidationError[] = [...errors];

    if (data.length > 0) {
      // Use transaction for atomicity
      try {
        await this.prisma.$transaction(async (tx) => {
          for (let i = 0; i < data.length; i++) {
            const scheduleData = data[i];
            const rowNumber = i + 2; // CSV row number

            try {
              // Check if course exists
              const course = await tx.course.findUnique({
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

              // Create schedule
              const schedule = await tx.schedule.create({
                data: {
                  courseCode: scheduleData.courseCode,
                  dayOfWeek: scheduleData.dayOfWeek,
                  startTime: scheduleData.startTime,
                  endTime: scheduleData.endTime,
                  venue: scheduleData.venue,
                  type: scheduleData.type || 'LECTURE', // Default to LECTURE if not specified
                },
                include: {
                  course: {
                    include: { department: true },
                  },
                },
              });

              created.push(schedule);
            } catch (error) {
              allErrors.push({
                row: rowNumber,
                field: 'general',
                value: scheduleData,
                message: `Failed to create schedule: ${error instanceof Error ? error.message : 'Unknown error'}`,
              });
            }
          }

          // If there are any errors, rollback the transaction
          if (allErrors.length > 0) {
            throw new Error('Validation errors found');
          }
        });
      } catch {
        // Transaction was rolled back due to errors
        created.length = 0; // Clear created array since transaction was rolled back
      }
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
}
