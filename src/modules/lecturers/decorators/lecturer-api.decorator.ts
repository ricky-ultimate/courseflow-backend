import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
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
