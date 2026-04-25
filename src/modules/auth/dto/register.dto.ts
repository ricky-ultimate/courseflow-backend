import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  Matches,
} from 'class-validator';
import { Role } from '../../../generated/prisma';

const ALLOWED_SELF_REGISTRATION_ROLES = [Role.STUDENT, Role.LECTURER] as const;
type AllowedRole = (typeof ALLOWED_SELF_REGISTRATION_ROLES)[number];

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

  @ApiProperty({
    enum: ALLOWED_SELF_REGISTRATION_ROLES,
    required: false,
    default: Role.STUDENT,
    description: 'Only STUDENT and LECTURER roles can self-register',
  })
  @IsEnum(ALLOWED_SELF_REGISTRATION_ROLES)
  @IsOptional()
  role?: AllowedRole;

  @ApiProperty({
    example: 'CSC',
    description: 'Required for all self-registration',
  })
  @IsString()
  @Matches(/^[A-Z]{2,4}$/, {
    message: 'Department code must be 2-4 uppercase letters',
  })
  @IsNotEmpty()
  departmentCode: string;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;
}
