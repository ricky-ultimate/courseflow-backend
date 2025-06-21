import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import {
  ApiStandardResponses,
  ApiAuthRequired,
  ApiNotFoundResponse,
  ApiBulkOperationResponse,
  ApiStatisticsResponse,
  ApiCsvTemplateResponse,
} from '../../common/decorators/base-api.decorator';

export const ApiGetDepartments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all departments',
      description: 'Retrieve all active departments',
    }),
    ApiResponse({
      status: 200,
      description: 'Departments retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'CS' },
            name: { type: 'string', example: 'Computer Science' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetDepartmentByCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get department by code',
      description: 'Retrieve a specific department by its code',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Department code',
      example: 'CS',
    }),
    ApiResponse({
      status: 200,
      description: 'Department retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'CS' },
          name: { type: 'string', example: 'Computer Science' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateDepartment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create a new department',
      description: 'Create a new department with unique code',
    }),
    ApiResponse({
      status: 201,
      description: 'Department created successfully',
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'CS' },
          name: { type: 'string', example: 'Computer Science' },
          isActive: { type: 'boolean', example: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateDepartment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update a department',
      description: 'Update an existing department by code',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Department code',
      example: 'CS',
    }),
    ApiResponse({
      status: 200,
      description: 'Department updated successfully',
    }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDeleteDepartment = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete a department',
      description:
        'Soft delete a department by code (only if no active courses)',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Department code',
      example: 'CS',
    }),
    ApiResponse({
      status: 200,
      description: 'Department deleted successfully',
    }),
    ApiResponse({
      status: 409,
      description: 'Conflict - Department has active courses',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 409 },
          message: {
            type: 'string',
            example: 'Cannot delete department. It has 15 active courses.',
          },
          error: { type: 'string', example: 'Conflict' },
        },
      },
    }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiSearchDepartments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Search departments',
      description: 'Search departments by name or code (case-insensitive)',
    }),
    ApiParam({
      name: 'term',
      type: 'string',
      description: 'Search term',
      example: 'computer',
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

export const ApiGetDepartmentsWithCourses = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get departments with courses',
      description: 'Retrieve departments that have active courses',
    }),
    ApiResponse({
      status: 200,
      description: 'Departments with courses retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            code: { type: 'string', example: 'CS' },
            name: { type: 'string', example: 'Computer Science' },
            courses: {
              type: 'array',
              items: { type: 'object' },
            },
          },
        },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetDepartmentsWithoutCourses = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get departments without courses',
      description: 'Retrieve departments that have no active courses',
    }),
    ApiResponse({
      status: 200,
      description: 'Departments without courses retrieved successfully',
      schema: {
        type: 'array',
        items: { type: 'object' },
      },
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetDepartmentStatistics = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get department statistics',
      description: 'Retrieve comprehensive statistics about departments',
    }),
    ApiResponse({
      status: 200,
      description: 'Department statistics retrieved successfully',
      schema: ApiStatisticsResponse({
        totalDepartments: { type: 'number', example: 12 },
        departmentsWithCourses: { type: 'number', example: 10 },
        departmentsWithoutCourses: { type: 'number', example: 2 },
        averageCoursesPerDepartment: { type: 'number', example: 12.5 },
      }),
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiBulkCreateDepartments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Bulk create departments from CSV',
      description:
        'Upload a CSV file to create multiple departments at once. CSV must have columns: code, name',
    }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          file: {
            type: 'string',
            format: 'binary',
            description: 'CSV file with departments data',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Bulk operation completed',
      schema: ApiBulkOperationResponse('Department'),
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiDownloadDepartmentTemplate = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Download CSV template for bulk department creation',
      description:
        'Download a CSV template file with the required headers and sample data',
    }),
    ApiCsvTemplateResponse(),
    ApiStandardResponses(),
  );
