import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { Logger } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { College, Role } from '../../generated/prisma';

const PUBLIC_REGISTRATION_ROLES: Role[] = [Role.STUDENT, Role.LECTURER];

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const requestedRole = dto.role ?? Role.STUDENT;

    if (!PUBLIC_REGISTRATION_ROLES.includes(requestedRole)) {
      throw new ForbiddenException(
        `Role '${requestedRole}' cannot be self-assigned during registration`,
      );
    }

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

    if (!dto.departmentCode) {
      throw new BadRequestException(
        `Department code is required for ${requestedRole} role`,
      );
    }

    const department = await this.prisma.department.findUnique({
      where: { code: dto.departmentCode },
    });

    if (!department) {
      throw new NotFoundException(
        `Department with code '${dto.departmentCode}' not found`,
      );
    }

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        matricNO: dto.matricNO,
        email: dto.email,
        password: hashedPassword,
        name: dto.name,
        role: requestedRole,
        phone: dto.phone,
        departmentCode: dto.departmentCode,
      },
      select: {
        id: true,
        matricNO: true,
        email: true,
        name: true,
        role: true,
        collegeCode: true,
        departmentCode: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.collegeCode ?? undefined,
    );

    return { user, ...tokens };
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

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.collegeCode ?? undefined,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        collegeCode: user.collegeCode,
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
        collegeCode: true,
      },
    });
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email, isActive: true },
    });

    if (!user) {
      return {
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetToken: hashedToken, resetTokenExpiry },
    });

    this.logger.log(
      `Password reset requested for user ${user.id}. Token delivery should be handled by a mail service.`,
    );

    return {
      message:
        'If an account with that email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const hashedToken = crypto
      .createHash('sha256')
      .update(dto.token)
      .digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { resetToken: hashedToken, isActive: true },
    });

    if (!user) throw new BadRequestException('Invalid or expired reset token');

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

    return { message: 'Password has been reset successfully' };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
      select: {
        id: true,
        matricNO: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        collegeCode: true,
        departmentCode: true,
        department: { select: { name: true, code: true } },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) throw new UnauthorizedException('User not found or inactive');

    return user;
  }

  private generateTokens(
    userId: string,
    email: string,
    role: string,
    collegeCode?: College,
  ) {
    const payload: Record<string, unknown> = { sub: userId, email, role };

    if (collegeCode) payload.collegeCode = collegeCode;

    const accessToken = this.jwtService.sign(payload);

    return { access_token: accessToken, token_type: 'Bearer' };
  }
}
