import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';

import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateVerificationCodeDto } from './dto/create-verification-code.dto';
import { UpdateVerificationCodeDto } from './dto/update-verification-code.dto';
import { Role } from '../generated/prisma';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ email: dto.email }, { matricNO: dto.matricNO }] },
    });

    if (existingUser) {
      if (existingUser.email === dto.email) {
        throw new ConflictException('User with this email already exists');
      }
      throw new ConflictException(
        'User with this matric number already exists',
      );
    }

    // Default role is STUDENT
    const userRole = dto.role || Role.STUDENT;

    // Verify verification code for ADMIN or LECTURER roles
    if (userRole === Role.ADMIN || userRole === Role.LECTURER) {
      if (!dto.verificationCode) {
        throw new BadRequestException(
          `Verification code is required for ${userRole} role`,
        );
      }

      const verificationCode = await this.prisma.verificationCode.findUnique({
        where: { code: dto.verificationCode },
      });

      if (!verificationCode) {
        throw new BadRequestException('Invalid verification code');
      }

      if (!verificationCode.isActive) {
        throw new BadRequestException('Verification code is inactive');
      }

      if (verificationCode.role !== userRole) {
        throw new BadRequestException(
          `Verification code is not valid for ${userRole} role`,
        );
      }

      if (
        verificationCode.expiresAt &&
        verificationCode.expiresAt < new Date()
      ) {
        throw new BadRequestException('Verification code has expired');
      }

      if (
        verificationCode.maxUsage &&
        verificationCode.usageCount >= verificationCode.maxUsage
      ) {
        throw new BadRequestException('Verification code usage limit exceeded');
      }

      // Update usage count
      await this.prisma.verificationCode.update({
        where: { id: verificationCode.id },
        data: { usageCount: { increment: 1 } },
      });
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        matricNO: dto.matricNO,
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: userRole,
      },
      select: {
        id: true,
        matricNO: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user,
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.password, dto.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, isActive: true },
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send email with reset token
    // For now, we'll return the token in development mode
    // In production, this should be sent via email
    console.log(`Password reset token for ${user.email}: ${resetToken}`);

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
      // Remove this in production - only for development
      ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: {
        resetToken: dto.token,
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    const hashedPassword = await argon2.hash(dto.newPassword);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return {
      message: 'Password has been reset successfully',
    };
  }

  async createVerificationCode(
    dto: CreateVerificationCodeDto,
    createdBy: string,
  ) {
    const existingCode = await this.prisma.verificationCode.findUnique({
      where: { code: dto.code },
    });

    if (existingCode) {
      throw new ConflictException('Verification code already exists');
    }

    const verificationCode = await this.prisma.verificationCode.create({
      data: {
        code: dto.code,
        role: dto.role,
        description: dto.description,
        maxUsage: dto.maxUsage,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        createdBy,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return verificationCode;
  }

  async getVerificationCodes() {
    return this.prisma.verificationCode.findMany({
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVerificationCode(id: string) {
    const verificationCode = await this.prisma.verificationCode.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!verificationCode) {
      throw new NotFoundException('Verification code not found');
    }

    return verificationCode;
  }

  async updateVerificationCode(id: string, dto: UpdateVerificationCodeDto) {
    const existingCode = await this.getVerificationCode(id);

    // If updating the code itself, check for conflicts
    if (dto.code && dto.code !== existingCode.code) {
      const codeExists = await this.prisma.verificationCode.findUnique({
        where: { code: dto.code },
      });

      if (codeExists) {
        throw new ConflictException('Verification code already exists');
      }
    }

    return this.prisma.verificationCode.update({
      where: { id },
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async deleteVerificationCode(id: string) {
    await this.getVerificationCode(id); // Check if exists

    return this.prisma.verificationCode.delete({
      where: { id },
    });
  }

  private async generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = await this.jwtService.signAsync(payload);

    return {
      access_token: accessToken,
      token_type: 'Bearer',
    };
  }
}
