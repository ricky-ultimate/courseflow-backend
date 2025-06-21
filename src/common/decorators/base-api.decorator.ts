import { applyDecorators } from '@nestjs/common';
import { ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

/**
 * Standard API responses that apply to most endpoints
 */
export const ApiStandardResponses = () =>
  applyDecorators(
    ApiResponse({
      status: 400,
      description: 'Bad Request - Invalid input data',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 400 },
          message: {
            oneOf: [
              { type: 'string', example: 'Validation failed' },
              {
                type: 'array',
                items: { type: 'string' },
                example: ['name should not be empty', 'code must be a string'],
              },
            ],
          },
          error: { type: 'string', example: 'Bad Request' },
        },
      },
    }),
    ApiResponse({
      status: 401,
      description: 'Unauthorized - Authentication required',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 401 },
          message: { type: 'string', example: 'Unauthorized' },
          error: { type: 'string', example: 'Unauthorized' },
        },
      },
    }),
    ApiResponse({
      status: 403,
      description: 'Forbidden - Insufficient permissions',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 403 },
          message: { type: 'string', example: 'Forbidden resource' },
          error: { type: 'string', example: 'Forbidden' },
        },
      },
    }),
    ApiResponse({
      status: 500,
      description: 'Internal Server Error',
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 500 },
          message: { type: 'string', example: 'Internal server error' },
          error: { type: 'string', example: 'Internal Server Error' },
        },
      },
    }),
  );

/**
 * Authentication required decorator
 */
export const ApiAuthRequired = () => applyDecorators(ApiBearerAuth('JWT-auth'));

/**
 * Not found response for entity operations
 */
export const ApiNotFoundResponse = (entityName: string) =>
  applyDecorators(
    ApiResponse({
      status: 404,
      description: `${entityName} not found`,
      schema: {
        type: 'object',
        properties: {
          statusCode: { type: 'number', example: 404 },
          message: { type: 'string', example: `${entityName} not found` },
          error: { type: 'string', example: 'Not Found' },
        },
      },
    }),
  );

/**
 * Bulk operation response schema
 */
export const ApiBulkOperationResponse = (entityName: string) => ({
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    created: {
      type: 'array',
      items: { type: 'object' },
      description: `Successfully created ${entityName.toLowerCase()}s`,
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
      description: 'Validation errors with row details',
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
});

/**
 * Statistics response schema
 */
export const ApiStatisticsResponse = (properties: Record<string, any>) => ({
  type: 'object',
  properties,
});

/**
 * CSV template response headers
 */
export const ApiCsvTemplateResponse = () =>
  applyDecorators(
    ApiResponse({
      status: 200,
      description: 'CSV template file',
      headers: {
        'Content-Type': { description: 'text/csv' },
        'Content-Disposition': {
          description: 'attachment; filename=template.csv',
        },
      },
    }),
  );
