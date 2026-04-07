import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Role } from '../../../generated/prisma';

const commonErrorResponses = () => [
  ApiBadRequestResponse({
    description: 'Bad Request - Invalid input data',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Invalid input data' },
        statusCode: { type: 'number', example: 400 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  }),
  ApiTooManyRequestsResponse({
    description: 'Too Many Requests - Rate limit exceeded',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Rate limit exceeded' },
        statusCode: { type: 'number', example: 429 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  }),
];

const authRequiredResponses = () => [
  ApiBearerAuth('JWT-auth'),
  ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid or missing token',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Invalid or expired token' },
        statusCode: { type: 'number', example: 401 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  }),
];

export const ApiRegister = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description: 'Register a new user account.',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['matricNO', 'email', 'password'],
        properties: {
          matricNO: {
            type: 'string',
            example: 'CS/2023/001',
            description: 'Student matric number or staff ID',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: { type: 'string', minLength: 6, example: 'password123' },
          name: {
            type: 'string',
            example: 'John Doe',
            description: 'Optional full name',
          },
          role: {
            type: 'string',
            enum: Object.values(Role),
            default: 'STUDENT',
            example: 'STUDENT',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'User registered successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user_id' },
                  matricNO: { type: 'string', example: 'CS/2023/001' },
                  email: { type: 'string', example: 'user@example.com' },
                  name: { type: 'string', example: 'John Doe' },
                  role: { type: 'string', example: 'STUDENT' },
                },
              },
              access_token: { type: 'string', example: 'jwt-token-here' },
              token_type: { type: 'string', example: 'Bearer' },
            },
          },
        },
      },
    }),
    ApiConflictResponse({
      description: 'User with email or matric number already exists',
    }),
    ...commonErrorResponses(),
  );

export const ApiLogin = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Login user',
      description: 'Authenticate user and receive JWT token',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: { type: 'string', example: 'password123' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'User logged in successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'user_id' },
                  matricNO: { type: 'string', example: 'CS/2023/001' },
                  email: { type: 'string', example: 'user@example.com' },
                  name: { type: 'string', example: 'John Doe' },
                  role: { type: 'string', example: 'STUDENT' },
                },
              },
              access_token: { type: 'string', example: 'jwt-token-here' },
              token_type: { type: 'string', example: 'Bearer' },
            },
          },
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Invalid credentials',
    }),
    ...commonErrorResponses(),
  );

export const ApiForgotPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Request password reset',
      description: "Send a password reset token to the user's email address",
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset instructions sent if email exists',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example:
              'If an account with that email exists, a password reset link has been sent.',
          },
        },
      },
    }),
    ...commonErrorResponses(),
  );

export const ApiResetPassword = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Reset password',
      description: 'Reset user password using the token received via email',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['token', 'password'],
        properties: {
          token: { type: 'string', example: 'reset_token' },
          password: { type: 'string', minLength: 6, example: 'newpassword123' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Password reset successfully',
      schema: {
        type: 'object',
        properties: {
          message: {
            type: 'string',
            example: 'Password has been reset successfully',
          },
        },
      },
    }),
    ApiBadRequestResponse({
      description: 'Invalid or expired reset token',
    }),
    ...commonErrorResponses(),
  );

export const ApiGetMe = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get current user',
      description: 'Get current authenticated user information',
    }),
    ApiResponse({
      status: 200,
      description: 'User information retrieved successfully',
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: {
            type: 'object',
            properties: {
              id: { type: 'string', example: 'user_id' },
              matricNO: { type: 'string', example: 'CS/2023/001' },
              email: { type: 'string', example: 'user@example.com' },
              name: { type: 'string', example: 'John Doe' },
              role: { type: 'string', example: 'STUDENT' },
              createdAt: { type: 'string', format: 'date-time' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
          message: { type: 'string', example: 'User retrieved successfully' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
    }),
    ...authRequiredResponses(),
    ...commonErrorResponses(),
  );
