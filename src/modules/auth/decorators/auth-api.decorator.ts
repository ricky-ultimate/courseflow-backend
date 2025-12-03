import { applyDecorators } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiConflictResponse,
  ApiBadRequestResponse,
  ApiTooManyRequestsResponse,
} from '@nestjs/swagger';
import { Role } from '../../../generated/prisma';

// Common error responses
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

const adminOnlyResponses = () => [
  ...authRequiredResponses(),
  ApiForbiddenResponse({
    description: 'Forbidden - Admin access required',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        error: { type: 'string', example: 'Insufficient permissions' },
        statusCode: { type: 'number', example: 403 },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  }),
];

// Auth endpoint decorators
export const ApiRegister = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Register a new user',
      description:
        'Register a new user account. ADMIN and LECTURER roles require verification code.',
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
          verificationCode: {
            type: 'string',
            example: 'ADMIN-2025-ABC123',
            description: 'Required for ADMIN/LECTURER roles',
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

export const ApiCreateVerificationCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Create verification code (Admin only)',
      description:
        'Create a new verification code for ADMIN or LECTURER role assignment',
    }),
    ApiBody({
      schema: {
        type: 'object',
        required: ['code', 'role'],
        properties: {
          code: { type: 'string', example: 'ADMIN-2025-ABC123' },
          role: {
            type: 'string',
            enum: [Role.ADMIN, Role.LECTURER],
            example: 'ADMIN',
          },
          description: {
            type: 'string',
            example: 'Admin verification code for 2025',
          },
          maxUsage: {
            type: 'number',
            example: 10,
            description: 'Maximum number of uses',
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            description: 'Expiration date',
          },
        },
      },
    }),
    ApiResponse({
      status: 201,
      description: 'Verification code created successfully',
    }),
    ApiConflictResponse({
      description: 'Verification code already exists',
    }),
    ...adminOnlyResponses(),
    ...commonErrorResponses(),
  );

export const ApiGetVerificationCodes = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get all verification codes (Admin only)',
      description: 'Retrieve all verification codes with usage statistics',
    }),
    ApiResponse({
      status: 200,
      description: 'Verification codes retrieved successfully',
    }),
    ...adminOnlyResponses(),
    ...commonErrorResponses(),
  );

export const ApiGetVerificationCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Get verification code by ID (Admin only)',
      description: 'Retrieve a specific verification code by its ID',
    }),
    ApiParam({ name: 'id', description: 'Verification code ID' }),
    ApiResponse({
      status: 200,
      description: 'Verification code retrieved successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Verification code not found',
    }),
    ...adminOnlyResponses(),
    ...commonErrorResponses(),
  );

export const ApiUpdateVerificationCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Update verification code (Admin only)',
      description: 'Update an existing verification code',
    }),
    ApiParam({ name: 'id', description: 'Verification code ID' }),
    ApiBody({
      schema: {
        type: 'object',
        properties: {
          code: { type: 'string', example: 'ADMIN-2025-ABC123' },
          role: { type: 'string', enum: [Role.ADMIN, Role.LECTURER] },
          description: { type: 'string' },
          maxUsage: { type: 'number' },
          expiresAt: { type: 'string', format: 'date-time' },
          isActive: { type: 'boolean' },
        },
      },
    }),
    ApiResponse({
      status: 200,
      description: 'Verification code updated successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Verification code not found',
    }),
    ApiConflictResponse({
      description: 'Verification code already exists',
    }),
    ...adminOnlyResponses(),
    ...commonErrorResponses(),
  );

export const ApiDeleteVerificationCode = () =>
  applyDecorators(
    ApiOperation({
      summary: 'Delete verification code (Admin only)',
      description: 'Delete a verification code',
    }),
    ApiParam({ name: 'id', description: 'Verification code ID' }),
    ApiResponse({
      status: 200,
      description: 'Verification code deleted successfully',
    }),
    ApiResponse({
      status: 404,
      description: 'Verification code not found',
    }),
    ...adminOnlyResponses(),
    ...commonErrorResponses(),
  );
