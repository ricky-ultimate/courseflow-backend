import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Level } from '../../generated/prisma';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
  ApiBulkOperationResponse,
  ApiStatisticsResponse,
  ApiCsvTemplateResponse,
} from '../../common/decorators/base-api.decorator';

export const ApiGetCourses = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all courses',
      description: 'Retrieve all active courses with department information',
    }),
    ApiResponse({
      status: 200,
      description: 'Courses retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'CS101' },
            name: { type: 'string', example: 'Introduction to Programming' },
            level: {
              type: 'string',
              enum: Object.values(Level),
              example: 'LEVEL_100',
            },
            credits: { type: 'number', example: 3 },
            departmentCode: { type: 'string', example: 'CS' },
            department: {
              type: 'object',
              properties: {
                code: { type: 'string', example: 'CS' },
                name: { type: 'string', example: 'Computer Science' },
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

export const ApiGetCourseByCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get course by code',
      description: 'Retrieve a specific course by its code',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Course code',
      example: 'CS101',
    }),
    ApiResponse({
      status: 200,
      description: 'Course retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'CS101' },
          name: { type: 'string', example: 'Introduction to Programming' },
          level: { type: 'string', enum: Object.values(Level) },
          credits: { type: 'number', example: 3 },
          departmentCode: { type: 'string', example: 'CS' },
          department: { type: 'object' },
        },
      },
    }),
    ApiNotFoundResponse('Course'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateCourse = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new course',
      description: 'Create a new course with department validation',
    }),
    ApiResponse({
      status: 201,
      description: 'Course created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'CS101' },
          name: { type: 'string', example: 'Introduction to Programming' },
          level: { type: 'string', enum: Object.values(Level) },
          credits: { type: 'number', example: 3 },
          departmentCode: { type: 'string', example: 'CS' },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateCourse = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a course',
      description: 'Update an existing course by code',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Course code',
      example: 'CS101',
    }),
    ApiResponse({
      status: 200,
      description: 'Course updated successfully',
    }),
    ApiNotFoundResponse('Course'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDeleteCourse = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a course',
      description: 'Soft delete a course by code',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Course code',
      example: 'CS101',
    }),
    ApiResponse({
      status: 200,
      description: 'Course deleted successfully',
    }),
    ApiNotFoundResponse('Course'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetCoursesByDepartment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get courses by department',
      description: 'Retrieve all courses for a specific department',
    }),
    ApiParam({
      name: 'departmentCode',
      type: 'string',
      description: 'Department code',
      example: 'CS',
    }),
    ApiResponse({
      status: 200,
      description: 'Courses retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetCoursesByLevel = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get courses by academic level',
      description: 'Retrieve all courses for a specific academic level',
    }),
    ApiParam({
      name: 'level',
      enum: Level,
      description: 'Academic level',
      example: 'LEVEL_100',
    }),
    ApiResponse({
      status: 200,
      description: 'Courses retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiSearchCourses = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Search courses',
      description: 'Search courses by name or code (case-insensitive)',
    }),
    ApiParam({
      name: 'term',
      type: 'string',
      description: 'Search term',
      example: 'programming',
    }),
    ApiResponse({
      status: 200,
      description: 'Search results retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetCoursesWithoutSchedules = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get courses without schedules',
      description: 'Retrieve courses that have no scheduled classes',
    }),
    ApiResponse({
      status: 200,
      description: 'Courses without schedules retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetCourseStatistics = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get course statistics',
      description: 'Retrieve comprehensive statistics about courses',
    }),
    ApiResponse({
      status: 200,
      description: 'Course statistics retrieved successfully',
      schema: ApiStatisticsResponse({
        totalCourses: { type: 'number', example: 150 },
        coursesByLevel: {
          type: 'object',
          properties: {
            LEVEL_100: { type: 'number', example: 30 },
            LEVEL_200: { type: 'number', example: 40 },
            LEVEL_300: { type: 'number', example: 35 },
            LEVEL_400: { type: 'number', example: 25 },
            LEVEL_500: { type: 'number', example: 20 },
          },
        },
        coursesByDepartment: {
          type: 'object',
          additionalProperties: { type: 'number' },
          example: { CS: 45, MATH: 30, ENG: 25 },
        },
        averageCredits: { type: 'number', example: 3.2 },
      }),
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiBulkCreateCourses = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk create courses from CSV',
      description:
        'Upload a CSV file to create multiple courses at once. CSV must have columns: code, name, level, credits, departmentCode',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'CSV file with courses data',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Bulk operation completed',
      schema: ApiBulkOperationResponse('Course'),
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDownloadCourseTemplate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Download CSV template for bulk course creation',
      description:
        'Download a CSV template file with the required headers and sample data',
    }),
    ApiCsvTemplateResponse(),
    ApiStandardResponses(),
  );
