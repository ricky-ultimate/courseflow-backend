import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';

export const ApiHealthCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Health check',
      description:
        'Check the health status of the application and its dependencies',
    }),
    ApiResponse({
      status: 200,
      description: 'Application is healthy',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          info: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                },
              },
              memory_heap: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                  used: { type: 'number', example: 45678912 },
                  limit: { type: 'number', example: 157286400 },
                },
              },
              memory_rss: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'up' },
                  used: { type: 'number', example: 67890123 },
                  limit: { type: 'number', example: 157286400 },
                },
              },
            },
          },
          error: { type: 'object' },
          details: { type: 'object' },
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: 'Application is unhealthy',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          error: {
            type: 'object',
            properties: {
              database: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'down' },
                  message: { type: 'string', example: 'Connection failed' },
                },
              },
            },
          },
        },
      },
    }),
  );

export const ApiSimpleHealthCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Simple health check',
      description: 'Simple endpoint to check if the application is running',
    }),
    ApiResponse({
      status: 200,
      description: 'Application is running',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number', example: 12345.67 },
          environment: { type: 'string', example: 'development' },
          version: { type: 'string', example: '1.0.0' },
        },
      },
    }),
  );

export const ApiDatabaseHealthCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Database health check',
      description: 'Check the database connection and basic operations',
    }),
    ApiResponse({
      status: 200,
      description: 'Database is healthy',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          database: {
            type: 'object',
            properties: {
              connected: { type: 'boolean', example: true },
              responseTime: { type: 'number', example: 45 },
              tables: {
                type: 'object',
                properties: {
                  departments: { type: 'number', example: 12 },
                  courses: { type: 'number', example: 150 },
                  schedules: { type: 'number', example: 300 },
                  users: { type: 'number', example: 500 },
                },
              },
            },
          },
        },
      },
    }),
    ApiResponse({
      status: 503,
      description: 'Database is unhealthy',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'error' },
          error: { type: 'string', example: 'Database connection failed' },
        },
      },
    }),
  );

export const ApiReadinessCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Readiness probe',
      description:
        'Check if the application is ready to serve traffic (for Kubernetes)',
    }),
    ApiResponse({
      status: 200,
      description: 'Application is ready',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ready' },
          checks: {
            type: 'object',
            properties: {
              database: { type: 'boolean', example: true },
              dependencies: { type: 'boolean', example: true },
            },
          },
        },
      },
    }),
  );

export const ApiLivenessCheck = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Liveness probe',
      description: 'Check if the application is alive (for Kubernetes)',
    }),
    ApiResponse({
      status: 200,
      description: 'Application is alive',
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'alive' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
  );
