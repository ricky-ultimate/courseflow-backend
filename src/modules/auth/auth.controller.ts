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
import { ApiTags } from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { CreateVerificationCodeDto } from './dto/create-verification-code.dto';
import { UpdateVerificationCodeDto } from './dto/update-verification-code.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma';
import { AuthenticatedRequest } from '../../common/types/auth.types';
import {
  ApiRegister,
  ApiLogin,
  ApiForgotPassword,
  ApiResetPassword,
  ApiGetMe,
  ApiCreateVerificationCode,
  ApiGetVerificationCodes,
  ApiGetVerificationCode,
  ApiUpdateVerificationCode,
  ApiDeleteVerificationCode,
} from './decorators/auth-api.decorator';

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiRegister()
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiLogin()
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('forgot-password')
  @ApiForgotPassword()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @ApiResetPassword()
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('verification-codes')
  @Roles(Role.ADMIN)
  @ApiCreateVerificationCode()
  async createVerificationCode(
    @Body() dto: CreateVerificationCodeDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.createVerificationCode(dto, req.user.id);
  }

  @Get('verification-codes')
  @Roles(Role.ADMIN)
  @ApiGetVerificationCodes()
  async getVerificationCodes() {
    return this.authService.getVerificationCodes();
  }

  @Get('verification-codes/:id')
  @Roles(Role.ADMIN)
  @ApiGetVerificationCode()
  async getVerificationCode(@Param('id') id: string) {
    return this.authService.getVerificationCode(id);
  }

  @Patch('verification-codes/:id')
  @Roles(Role.ADMIN)
  @ApiUpdateVerificationCode()
  async updateVerificationCode(
    @Param('id') id: string,
    @Body() dto: UpdateVerificationCodeDto,
  ) {
    return this.authService.updateVerificationCode(id, dto);
  }

  @Delete('verification-codes/:id')
  @Roles(Role.ADMIN)
  @ApiDeleteVerificationCode()
  async deleteVerificationCode(@Param('id') id: string) {
    return this.authService.deleteVerificationCode(id);
  }

  @Get('me')
  @ApiGetMe()
  async getMe(@Req() req: AuthenticatedRequest) {
    return this.authService.getMe(req.user.id);
  }
}
