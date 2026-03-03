import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  ValidateIf,
  Matches,
} from 'class-validator';
import { Role } from '../../../generated/prisma';

export class RegisterDto {
  @ApiProperty({ example: 'CS/2023/001' })
  @IsString()
  @IsNotEmpty()
  matricNO: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: Role, required: false, default: Role.STUDENT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({
    required: false,
    example: 'ADMIN-2025-ABC123',
    description: 'Required for ADMIN, LECTURER, or HOD roles',
  })
  @IsString()
  @ValidateIf(
    (o: RegisterDto) =>
      o.role === Role.ADMIN || o.role === Role.LECTURER || o.role === Role.HOD,
  )
  @IsNotEmpty()
  verificationCode?: string;

  @ApiProperty({
    example: 'CSC',
    description: 'Required for STUDENT, LECTURER, and HOD roles',
  })
  @IsString()
  @Matches(/^[A-Z]{2,4}$/, {
    message: 'Department code must be 2-4 uppercase letters',
  })
  @ValidateIf(
    (o: RegisterDto) =>
      o.role === Role.STUDENT ||
      o.role === Role.LECTURER ||
      o.role === Role.HOD ||
      o.role === undefined,
  )
  @IsNotEmpty()
  departmentCode?: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;
}
