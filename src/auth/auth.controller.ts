import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Param,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateVerificationCodeDto } from './dto/create-verification-code.dto';
import { UpdateVerificationCodeDto } from './dto/update-verification-code.dto';
import { Public } from '../common/decorators/public.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../generated/prisma';
import { AuthenticatedRequest } from '../common/types/auth.types';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'User logged in successfully' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiOperation({
    summary: 'Request password reset',
    description: "Send a password reset token to the user's email address",
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
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
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset user password using the token received via email',
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
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
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired reset token',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verification-codes')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create verification code (Admin only)',
    description:
      'Create a new verification code for ADMIN or LECTURER role assignment',
  })
  @ApiBody({ type: CreateVerificationCodeDto })
  @ApiResponse({
    status: 201,
    description: 'Verification code created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Verification code already exists',
  })
  async createVerificationCode(
    @Body() dto: CreateVerificationCodeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.createVerificationCode(dto, req.user.id);
  }

  @Get('verification-codes')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all verification codes (Admin only)',
    description: 'Retrieve all verification codes with usage statistics',
  })
  @ApiResponse({
    status: 200,
    description: 'Verification codes retrieved successfully',
  })
  async getVerificationCodes() {
    return this.authService.getVerificationCodes();
  }

  @Get('verification-codes/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get verification code by ID (Admin only)',
    description: 'Retrieve a specific verification code by its ID',
  })
  @ApiParam({ name: 'id', description: 'Verification code ID' })
  @ApiResponse({
    status: 200,
    description: 'Verification code retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Verification code not found',
  })
  async getVerificationCode(@Param('id') id: string) {
    return this.authService.getVerificationCode(id);
  }

  @Patch('verification-codes/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update verification code (Admin only)',
    description: 'Update an existing verification code',
  })
  @ApiParam({ name: 'id', description: 'Verification code ID' })
  @ApiBody({ type: UpdateVerificationCodeDto })
  @ApiResponse({
    status: 200,
    description: 'Verification code updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Verification code not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Verification code already exists',
  })
  async updateVerificationCode(
    @Param('id') id: string,
    @Body() dto: UpdateVerificationCodeDto,
  ) {
    return this.authService.updateVerificationCode(id, dto);
  }

  @Delete('verification-codes/:id')
  @Roles(Role.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete verification code (Admin only)',
    description: 'Delete a verification code',
  })
  @ApiParam({ name: 'id', description: 'Verification code ID' })
  @ApiResponse({
    status: 200,
    description: 'Verification code deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Verification code not found',
  })
  async deleteVerificationCode(@Param('id') id: string) {
    return this.authService.deleteVerificationCode(id);
  }
}
