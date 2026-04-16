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
} from '../../../common/decorators/base-api.decorator';

export const ApiGetDepartments = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all departments',
      description: 'Retrieve all active departments with optional filtering.',
    }),
    ApiResponse({
      status: 200,
      description: 'Departments retrieved successfully',
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
    }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetDepartmentWithFullDetails = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get department with full details',
      description:
        'Retrieve a department including all active courses, lecturers, and schedules',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Department code',
      example: 'CS',
    }),
    ApiResponse({
      status: 200,
      description: 'Department with full details retrieved successfully',
    }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetDepartmentProgrammes = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get programmes for a department',
      description:
        'Returns the unique course code prefixes (programmes) active within a department, ' +
        'along with the number of courses per programme. Useful for departments that host ' +
        'multiple degree programmes sharing the same department code (e.g. CSC hosts CSC, CSE, CYB, MTH).',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Department code',
      example: 'CSC',
    }),
    ApiResponse({
      status: 200,
      description: 'Programmes retrieved successfully',
      schema: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            programme: { type: 'string', example: 'CSE' },
            count: { type: 'number', example: 18 },
          },
        },
      },
    }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiCreateDepartment = () =>
  applyDecorators(
    ApiOperation({ summary: 'Create a new department' }),
    ApiResponse({
      status: 201,
      description: 'Department created successfully',
    }),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUpdateDepartment = () =>
  applyDecorators(
    ApiOperation({ summary: 'Update a department' }),
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
    ApiOperation({ summary: 'Delete a department' }),
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
    }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiGetDepartmentStatistics = () =>
  applyDecorators(
    ApiOperation({ summary: 'Get department statistics' }),
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
    ApiOperation({ summary: 'Bulk create departments from CSV' }),
    ApiConsumes('multipart/form-data'),
    ApiBody({
      schema: {
        type: 'object',
        properties: { file: { type: 'string', format: 'binary' } },
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
    }),
    ApiCsvTemplateResponse(),
    ApiStandardResponses(),
  );

export const ApiLockDepartmentSchedule = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Lock department schedule',
      description:
        'Prevent auto-generation from modifying this department. HODs may only lock their own department.',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Department code',
      example: 'CSC',
    }),
    ApiResponse({
      status: 200,
      description: 'Department schedule locked successfully',
    }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );

export const ApiUnlockDepartmentSchedule = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Unlock department schedule',
      description:
        'Re-include this department in auto-generation runs. HODs may only unlock their own department.',
    }),
    ApiParam({
      name: 'code',
      type: 'string',
      description: 'Department code',
      example: 'CSC',
    }),
    ApiResponse({
      status: 200,
      description: 'Department schedule unlocked successfully',
    }),
    ApiResponse({ status: 403, description: 'Forbidden' }),
    ApiNotFoundResponse('Department'),
    ApiStandardResponses(),
    ApiAuthRequired(),
  );
