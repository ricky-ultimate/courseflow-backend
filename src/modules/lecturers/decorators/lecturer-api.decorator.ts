import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
} from '../../../common/decorators/base-api.decorator';

export const ApiGetLecturers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all lecturers',
      description: 'Retrieve all active lecturers with department information',
    }),
    ApiResponse({
      status: 200,
      description: 'Lecturers retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string', example: 'Dr. Jane Smith' },
            email: { type: 'string', example: 'jane.smith@edu.com' },
            departmentCode: { type: 'string', example: 'CS' },
            department: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetLecturerById = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get lecturer by ID',
      description: 'Retrieve a specific lecturer by their ID',
    }),
    ApiParam({
      name: 'id',
      type: 'string',
      description: 'Lecturer ID',
    }),
    ApiResponse({
      status: 200,
      description: 'Lecturer retrieved successfully',
    }),
    ApiNotFoundResponse('Lecturer'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateLecturer = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new lecturer',
      description: 'Create a new lecturer record (Admin only)',
    }),
    ApiResponse({
      status: 201,
      description: 'Lecturer created successfully',
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateLecturer = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a lecturer',
      description: 'Update an existing lecturer',
    }),
    ApiParam({ name: 'id', type: 'string' }),
    ApiResponse({
      status: 200,
      description: 'Lecturer updated successfully',
    }),
    ApiNotFoundResponse('Lecturer'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDeleteLecturer = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a lecturer',
      description: 'Soft delete a lecturer',
    }),
    ApiParam({ name: 'id', type: 'string' }),
    ApiResponse({
      status: 200,
      description: 'Lecturer deleted successfully',
    }),
    ApiNotFoundResponse('Lecturer'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiSearchLecturers = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Search lecturers',
      description: 'Search lecturers by name (case-insensitive)',
    }),
    ApiParam({
      name: 'term',
      type: 'string',
      description: 'Search term',
    }),
    ApiResponse({
      status: 200,
      description: 'Search results retrieved successfully',
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetLecturerDashboard = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get lecturer dashboard statistics',
      description:
        'Retrieve dashboard statistics for the authenticated lecturer',
    }),
    ApiResponse({
      status: 200,
      description: 'Dashboard statistics retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          totalCourses: { type: 'number', example: 5 },
          totalSchedules: { type: 'number', example: 12 },
          coursesByLevel: {
            type: 'object',
            example: {
              LEVEL_100: 1,
              LEVEL_200: 2,
              LEVEL_300: 2,
            },
          },
          schedulesByDay: {
            type: 'object',
            example: {
              MONDAY: 3,
              TUESDAY: 2,
              WEDNESDAY: 3,
              THURSDAY: 2,
              FRIDAY: 2,
            },
          },
          upcomingClasses: { type: 'number', example: 8 },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetLecturerCourses = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get my courses',
      description: 'Retrieve all courses taught by the authenticated lecturer',
    }),
    ApiResponse({
      status: 200,
      description: 'Lecturer courses retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          lecturer: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              email: { type: 'string' },
              departmentCode: { type: 'string' },
            },
          },
          courses: {
            type: 'array',
            items: { type: 'object' },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetLecturerSchedule = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get my schedule',
      description: 'Retrieve the timetable for the authenticated lecturer',
    }),
    ApiResponse({
      status: 200,
      description: 'Lecturer schedule retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          lecturer: { type: 'object' },
          activeSession: { type: 'object', nullable: true },
          schedulesByDay: {
            type: 'object',
            properties: {
              MONDAY: { type: 'array' },
              TUESDAY: { type: 'array' },
              WEDNESDAY: { type: 'array' },
              THURSDAY: { type: 'array' },
              FRIDAY: { type: 'array' },
              SATURDAY: { type: 'array' },
              SUNDAY: { type: 'array' },
            },
          },
          totalSchedules: { type: 'number' },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );
