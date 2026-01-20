import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsEmail,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { Level, Semester } from '../../../generated/prisma';

export class CreateCourseDto {
  @ApiProperty({ example: 'CS101' })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @ApiProperty({ example: 'Introduction to Computer Science' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    required: false,
    example: 'This course introduces students to fundamental concepts of computer science',
    description: 'Course overview/description'
  })
  @IsString({ message: 'Overview must be a string' })
  @IsOptional()
  overview?: string;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level: Level;

  @ApiProperty({ enum: Semester, default: Semester.FIRST })
  @IsEnum(Semester)
  semester: Semester = Semester.FIRST;

  @ApiProperty({
    example: 3,
    description: 'Number of credits for the course (1-6)',
  })
  @IsInt({ message: 'Credits must be an integer' })
  @Min(1, { message: 'Credits must be at least 1' })
  @Max(6, { message: 'Credits cannot exceed 6' })
  credits: number;

  @ApiProperty({ example: 'CS' })
  @IsString({ message: 'Department code must be a string' })
  @IsNotEmpty({ message: 'Department code is required' })
  departmentCode: string;

  @ApiProperty({
    example: 'lecturer@university.edu',
    description: 'Email of the lecturer taking the course',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Lecturer email is required' })
  lecturerEmail: string;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Whether this is a general studies course (available to all departments)',
  })
  @IsBoolean({ message: 'isGeneral must be a boolean' })
  @IsOptional()
  isGeneral?: boolean;

  @ApiProperty({
    required: false,
    default: false,
    description: 'Whether this course is locked (prevents deletion by standard admins)',
  })
  @IsBoolean({ message: 'isLocked must be a boolean' })
  @IsOptional()
  isLocked?: boolean;
}
