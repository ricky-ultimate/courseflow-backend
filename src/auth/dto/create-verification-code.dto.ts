import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { Role } from '../../generated/prisma';

export class CreateVerificationCodeDto {
  @ApiProperty({
    example: 'ADMIN-2025-ABC123',
    description: 'Unique verification code',
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @MaxLength(50, { message: 'Code cannot exceed 50 characters' })
  code: string;

  @ApiProperty({
    enum: Role,
    example: Role.ADMIN,
    description: 'Role that this verification code grants',
  })
  @IsEnum(Role, { message: 'Role must be STUDENT, LECTURER, or ADMIN' })
  role: Role;

  @ApiProperty({
    required: false,
    example: 'Admin access code for 2025 semester',
    description: 'Optional description for the verification code',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(200, { message: 'Description cannot exceed 200 characters' })
  description?: string;

  @ApiProperty({
    required: false,
    example: 10,
    description:
      'Maximum number of times this code can be used (null for unlimited)',
  })
  @IsInt({ message: 'Max usage must be an integer' })
  @Min(1, { message: 'Max usage must be at least 1' })
  @IsOptional()
  maxUsage?: number;

  @ApiProperty({
    required: false,
    example: '2025-12-31T23:59:59.000Z',
    description:
      'Expiration date for the verification code (null for no expiration)',
  })
  @IsDateString(
    {},
    { message: 'Expiration date must be a valid ISO date string' },
  )
  @IsOptional()
  expiresAt?: string;
}
