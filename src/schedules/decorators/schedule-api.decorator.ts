import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Level, DayOfWeek, ClassType } from '../../generated/prisma';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
  ApiBulkOperationResponse,
  ApiStatisticsResponse,
  ApiCsvTemplateResponse,
} from '../../common/decorators/base-api.decorator';

export const ApiGetSchedules = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all schedules',
      description:
        'Retrieve all schedules with course and department information',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedules retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            courseCode: { type: 'string', example: 'CS101' },
            dayOfWeek: {
              type: 'string',
              enum: Object.values(DayOfWeek),
              example: 'MONDAY',
            },
            startTime: { type: 'string', example: '08:00' },
            endTime: { type: 'string', example: '09:30' },
            venue: { type: 'string', example: 'Room 101' },
            type: {
              type: 'string',
              enum: Object.values(ClassType),
              example: 'LECTURE',
            },
            course: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'CS101' },
                name: {
                  type: 'string',
                  example: 'Introduction to Programming',
                },
                department: {
                  type: 'object',
                  properties: {
                    code: { type: 'string', example: 'CS' },
                    name: { type: 'string', example: 'Computer Science' },
                  },
                },
              },
            },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetScheduleById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedule by ID',
      description: 'Retrieve a specific schedule by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: 'Schedule ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedule retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          courseCode: { type: 'string', example: 'CS101' },
          dayOfWeek: { type: 'string', enum: Object.values(DayOfWeek) },
          startTime: { type: 'string', example: '08:00' },
          endTime: { type: 'string', example: '09:30' },
          venue: { type: 'string', example: 'Room 101' },
          type: { type: 'string', enum: Object.values(ClassType) },
          course: { type: 'object' },
        },
      },
    }),
    ApiNotFoundResponse('Schedule'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateSchedule = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new schedule',
      description: 'Create a new schedule with conflict detection',
    }),
    ApiResponse({
      status: 201,
      description: 'Schedule created successfully',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Schedule overlaps with existing schedule',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 409 },
          message: { type: 'string', example: 'Schedule conflict detected' },
          error: { type: 'string', example: 'Conflict' },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateSchedule = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a schedule',
      description: 'Update an existing schedule by ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: 'Schedule ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedule updated successfully',
    }),
    ApiNotFoundResponse('Schedule'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDeleteSchedule = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a schedule',
      description: 'Delete a schedule by ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: 'Schedule ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedule deleted successfully',
    }),
    ApiNotFoundResponse('Schedule'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetSchedulesByCourse = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedules by course',
      description: 'Retrieve all schedules for a specific course',
    }),
    ApiParam({
      name: 'courseCode',
      type: 'string',
      description: 'Course code',
      example: 'CS101',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedules retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetSchedulesByDepartment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedules by department',
      description:
        'Retrieve all schedules for courses in a specific department',
    }),
    ApiParam({
      name: 'departmentCode',
      type: 'string',
      description: 'Department code',
      example: 'CS',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedules retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetSchedulesByLevel = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedules by academic level',
      description:
        'Retrieve all schedules for courses at a specific academic level',
    }),
    ApiParam({
      name: 'level',
      enum: Level,
      description: 'Academic level',
      example: 'LEVEL_100',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedules retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetSchedulesByDayOfWeek = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedules by day of week',
      description: 'Retrieve all schedules for a specific day of the week',
    }),
    ApiParam({
      name: 'dayOfWeek',
      enum: DayOfWeek,
      description: 'Day of the week',
      example: 'MONDAY',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedules retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetSchedulesByVenue = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedules by venue',
      description:
        'Retrieve all schedules for a specific venue (partial match)',
    }),
    ApiParam({
      name: 'venue',
      type: 'string',
      description: 'Venue name or partial name',
      example: 'Room 101',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedules retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetSchedulesByClassType = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedules by class type',
      description: 'Retrieve all schedules for a specific class type',
    }),
    ApiParam({
      name: 'type',
      enum: ClassType,
      description: 'Class type',
      example: 'LECTURE',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedules retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetScheduleStatistics = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get schedule statistics',
      description:
        'Retrieve comprehensive statistics about schedules including counts by day and type',
    }),
    ApiResponse({
      status: 200,
      description: 'Schedule statistics retrieved successfully',
      schema: ApiStatisticsResponse({
        totalSchedules: { type: 'number', example: 120 },
        schedulesByDay: {
          type: 'object',
          properties: {
            MONDAY: { type: 'number', example: 25 },
            TUESDAY: { type: 'number', example: 20 },
            WEDNESDAY: { type: 'number', example: 22 },
            THURSDAY: { type: 'number', example: 18 },
            FRIDAY: { type: 'number', example: 15 },
            SATURDAY: { type: 'number', example: 10 },
            SUNDAY: { type: 'number', example: 10 },
          },
        },
        schedulesByType: {
          type: 'object',
          properties: {
            LECTURE: { type: 'number', example: 60 },
            SEMINAR: { type: 'number', example: 25 },
            LAB: { type: 'number', example: 20 },
            TUTORIAL: { type: 'number', example: 15 },
          },
        },
      }),
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiBulkCreateSchedules = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk create schedules from CSV',
      description:
        'Upload a CSV file to create multiple schedules at once. CSV must have columns: courseCode, dayOfWeek, startTime, endTime, venue, type (optional)',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'CSV file with schedules data',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Bulk operation completed',
      schema: ApiBulkOperationResponse('Schedule'),
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDownloadScheduleTemplate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Download CSV template for bulk schedule creation',
      description:
        'Download a CSV template file with the required headers and sample data',
    }),
    ApiCsvTemplateResponse(),
    ApiStandardResponses(),
  );
