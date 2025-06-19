import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Role } from '../../generated/prisma';

export class RegisterDto {
  @ApiProperty({ example: 'CS/2023/001' })
  @IsString({ message: 'Matric number must be a string' })
  @IsNotEmpty({ message: 'Matric number is required' })
  matricNO: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiProperty({
    enum: Role,
    required: false,
    default: Role.STUDENT,
    example: Role.STUDENT,
    description:
      'User role - defaults to STUDENT. ADMIN/LECTURER requires verification code',
  })
  @IsEnum(Role, { message: 'Role must be STUDENT, LECTURER, or ADMIN' })
  @IsOptional()
  role?: Role;

  @ApiProperty({
    required: false,
    example: 'ADMIN-2025-ABC123',
    description: 'Verification code required for ADMIN or LECTURER roles',
  })
  @IsString({ message: 'Verification code must be a string' })
  @ValidateIf(
    (o: RegisterDto) => o.role === Role.ADMIN || o.role === Role.LECTURER,
  )
  @IsNotEmpty({
    message: 'Verification code is required for ADMIN or LECTURER roles',
  })
  verificationCode?: string;
}
