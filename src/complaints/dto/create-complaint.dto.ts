import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsEnum,
  IsOptional,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ComplaintStatus } from '../../generated/prisma';

export class CreateComplaintDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  @Transform(({ value }) => value?.trim())
  name: string;

  @ApiProperty({ example: 'john@student.edu' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsString({ message: 'Department must be a string' })
  @IsNotEmpty({ message: 'Department is required' })
  department: string;

  @ApiProperty({ example: 'System Issue' })
  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  @MinLength(5, { message: 'Subject must be at least 5 characters' })
  @MaxLength(200, { message: 'Subject cannot exceed 200 characters' })
  subject: string;

  @ApiProperty({ example: 'Detailed description of the issue...' })
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  @MinLength(10, { message: 'Message must be at least 10 characters' })
  @MaxLength(1000, { message: 'Message cannot exceed 1000 characters' })
  message: string;

  @ApiProperty({ enum: ComplaintStatus, default: ComplaintStatus.PENDING })
  @IsEnum(ComplaintStatus, { message: 'Invalid complaint status' })
  @IsOptional()
  status?: ComplaintStatus = ComplaintStatus.PENDING;
}
