import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { Level } from '../../../generated/prisma';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
  ApiStatisticsResponse,
  ApiCsvTemplateResponse,
} from '../../../common/decorators/base-api.decorator';

const courseSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', format: 'uuid' },
    code: { type: 'string', example: 'CSC101' },
    name: { type: 'string', example: 'Introduction to Programming' },
    level: { type: 'string', enum: Object.values(Level), example: 'LEVEL_100' },
    credits: { type: 'number', example: 3 },
    departmentCode: { type: 'string', example: 'CSC' },
    department: { type: 'object' },
    lecturer: { type: 'object', nullable: true },
    isGeneral: { type: 'boolean', example: false },
    isLocked: { type: 'boolean', example: false },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
  },
};

export const ApiGetCourses = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all courses',
      description:
        'Retrieve courses with optional filtering by department, level, credits, lecturer, or search term.',
    }),
    ApiResponse({
      status: 200,
      description: 'Courses retrieved successfully',
      schema: { type: 'array', items: courseSchema },
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
      example: 'CSC101',
    }),
    ApiResponse({
      status: 200,
      description: 'Course retrieved successfully',
      schema: courseSchema,
    }),
    ApiNotFoundResponse('Course'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateCourse = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new course',
      description:
        'Create a new course with optional alias linking at creation time. ' +
        'Assigning a lecturer is optional; a course can be created without one and a lecturer can be assigned or changed later via update. ' +
        'Alias codes that do not resolve to existing courses are skipped and reported in aliasWarnings.',
    }),
    ApiResponse({
      status: 201,
      description: 'Course created successfully',
      schema: {
        type: 'object',
        allOf: [{ $ref: '#/components/schemas/Course' }],
        properties: {
          ...courseSchema.properties,
          aliasWarnings: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description:
              'Present only when one or more aliasOf codes could not be linked, with the reason per code.',
            example: ['CSE409: course not found, link skipped'],
          },
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
      example: 'CSC101',
    }),
    ApiResponse({
      status: 200,
      description: 'Course updated successfully',
      schema: courseSchema,
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
      example: 'CSC101',
    }),
    ApiResponse({
      status: 200,
      description: 'Course deleted successfully',
    }),
    ApiNotFoundResponse('Course'),
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
      schema: { type: 'array', items: courseSchema },
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
          example: { CSC: 45, MTH: 30 },
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
        'Upload a CSV file to create multiple courses at once. ' +
        'Required columns: code, name, level, semester, credits, departmentCode. ' +
        'Optional columns: lecturerEmail (leave blank to create courses without an assigned lecturer; when provided it must match an active LECTURER or HOD), ' +
        'aliasOfCodes (comma-separated course codes to link as aliases). ' +
        'Non-existent alias targets are skipped and returned in aliasWarnings.',
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
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          created: {
            type: 'array',
            items: courseSchema,
          },
          errors: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                row: { type: 'number', example: 2 },
                field: { type: 'string', example: 'code' },
                value: { type: 'string', example: 'INVALID' },
                message: { type: 'string', example: 'Code already exists' },
              },
            },
          },
          aliasWarnings: {
            type: 'array',
            items: { type: 'string' },
            nullable: true,
            description:
              'Alias codes that could not be linked, with reasons. Absent when no aliasOfCodes were supplied.',
            example: ['CSE409: course not found, link skipped'],
          },
          summary: {
            type: 'object',
            properties: {
              totalRows: { type: 'number', example: 10 },
              successCount: { type: 'number', example: 8 },
              errorCount: { type: 'number', example: 2 },
            },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDownloadCourseTemplate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Download CSV template for bulk course creation',
      description:
        'Returns a CSV template with all required and optional columns, including semester and aliasOfCodes.',
    }),
    ApiCsvTemplateResponse(),
    ApiStandardResponses(),
  );

export const ApiGetUniversityCoursesWithoutSchedules = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get university (general) courses without schedules',
      description:
        'Retrieve general/university-wide courses that have no schedule in the active academic session',
    }),
    ApiResponse({
      status: 200,
      description:
        'University courses without schedules retrieved successfully',
      schema: { type: 'array', items: courseSchema },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiBulkCreateCoursesMultiple = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk create courses from multiple CSV files',
      description:
        'Upload one or more CSV files to create multiple courses at once. Each file may target a different department or college. ' +
        'Required columns: code, name, level, semester, credits, departmentCode. ' +
        'Optional columns: lecturerEmail (leave blank to create courses without an assigned lecturer; when provided it must match an active LECTURER or HOD), ' +
        'aliasOfCodes (comma-separated course codes to link as aliases). ' +
        'Course codes that appear in more than one file are rejected on the second and subsequent occurrences and reported per file. ' +
        'Returns a consolidated report with a per-file breakdown of created courses and validation errors.',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: { type: 'string', format: 'binary' },
            description: 'One or more CSV files with courses data',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Multi-file bulk operation completed',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                fileName: { type: 'string', example: 'csc-courses.csv' },
                result: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    created: { type: 'array', items: courseSchema },
                    errors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          row: { type: 'number', example: 2 },
                          field: { type: 'string', example: 'code' },
                          value: { type: 'string', example: 'INVALID' },
                          message: {
                            type: 'string',
                            example: 'Code already exists',
                          },
                        },
                      },
                    },
                    aliasWarnings: {
                      type: 'array',
                      items: { type: 'string' },
                      nullable: true,
                    },
                    summary: {
                      type: 'object',
                      properties: {
                        totalRows: { type: 'number', example: 10 },
                        successCount: { type: 'number', example: 8 },
                        errorCount: { type: 'number', example: 2 },
                      },
                    },
                  },
                },
              },
            },
          },
          summary: {
            type: 'object',
            properties: {
              totalFiles: { type: 'number', example: 3 },
              totalRows: { type: 'number', example: 30 },
              successCount: { type: 'number', example: 26 },
              errorCount: { type: 'number', example: 4 },
            },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );
