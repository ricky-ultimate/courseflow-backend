import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiProperty({
    example: 'CSC',
    description: 'Unique department code (2-4 uppercase letters)',
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @Matches(/^[A-Z]{2,4}$/, {
    message: 'Code must be 2-4 uppercase letters (e.g., CSC, MTH)',
  })
  code: string;

  @ApiProperty({
    required: false,
    example:
      'The study of computation, information, and automation. Covers theoretical and practical aspects of hardware and software.',
    description: 'Detailed description of the department',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  @MaxLength(1000, { message: 'Description cannot exceed 1000 characters' })
  description?: string;

  @ApiProperty({
    required: false,
    example: 'hod.cs@university.edu',
    description:
      'Email of the user who will be the Head of Department (Must be a Lecturer or Admin)',
  })
  @IsEmail({}, { message: 'HOD Email must be a valid email address' })
  @IsOptional()
  hodEmail?: string;
}
