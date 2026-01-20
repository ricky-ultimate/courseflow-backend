import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
  ApiStatisticsResponse,
} from '../../../common/decorators/base-api.decorator';

export const ApiGetAcademicSessions = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all academic sessions',
      description: 'Retrieve all academic sessions with pagination support.',
    }),
    ApiResponse({
      status: 200,
      description: 'Academic sessions retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: '2024/2025' },
            startDate: { type: 'string', format: 'date-time' },
            endDate: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetAcademicSessionById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get academic session by ID',
      description: 'Retrieve a specific academic session by its ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      format: 'uuid',
      description: 'Session ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Academic session retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: '2024/2025' },
          startDate: { type: 'string', format: 'date-time' },
          endDate: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean', example: true },
        },
      },
    }),
    ApiNotFoundResponse('Academic Session'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetActiveSession = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get active academic session',
      description: 'Retrieve the currently active academic session',
    }),
    ApiResponse({
      status: 200,
      description: 'Active session retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: '2024/2025' },
          isActive: { type: 'boolean', example: true },
        },
      },
    }),
    ApiResponse({
      status: 404,
      description: 'No active session found',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: 'No active session found' },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateAcademicSession = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new academic session',
      description: 'Create a new academic session (Admin only)',
    }),
    ApiResponse({
      status: 201,
      description: 'Academic session created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string', example: '2025/2026' },
        },
      },
    }),
    ApiResponse({
      status: 400,
      description: 'Bad Request - End date must be after start date',
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateAcademicSession = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update academic session',
      description: 'Update session details',
    }),
    ApiParam({ name: 'id', type: 'string', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Academic session updated successfully',
    }),
    ApiNotFoundResponse('Academic Session'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiActivateSession = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Set active session',
      description:
        'Set this session as active. This will automatically deactivate all other sessions.',
    }),
    ApiParam({ name: 'id', type: 'string', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Session activated successfully',
    }),
    ApiNotFoundResponse('Academic Session'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiArchiveSession = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Archive academic session',
      description: 'Deactivate a session (Archive it)',
    }),
    ApiParam({ name: 'id', type: 'string', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Session archived successfully',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Session is already archived',
    }),
    ApiNotFoundResponse('Academic Session'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDeleteAcademicSession = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete academic session',
      description: 'Delete a session (only if no data is linked to it)',
    }),
    ApiParam({ name: 'id', type: 'string', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Session deleted successfully',
    }),
    ApiNotFoundResponse('Academic Session'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetSessionStatistics = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get session statistics',
      description:
        'Get count of schedules and exams associated with this session',
    }),
    ApiParam({ name: 'id', type: 'string', format: 'uuid' }),
    ApiResponse({
      status: 200,
      description: 'Statistics retrieved successfully',
      schema: ApiStatisticsResponse({
        totalSchedules: { type: 'number', example: 150 },
        totalExams: { type: 'number', example: 45 },
        schedulesBySemester: {
          type: 'object',
          properties: {
            FIRST: { type: 'number', example: 75 },
            SECOND: { type: 'number', example: 75 },
          },
        },
        examsBySemester: {
          type: 'object',
          properties: {
            FIRST: { type: 'number', example: 20 },
            SECOND: { type: 'number', example: 25 },
          },
        },
      }),
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );
