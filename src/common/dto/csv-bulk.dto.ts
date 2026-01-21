import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Level, DayOfWeek, VenueType } from '../../generated/prisma';

export interface CsvValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
}

export interface BulkOperationResult<T> {
  success: boolean;
  created: T[];
  errors: CsvValidationError[];
  summary: {
    totalRows: number;
    successCount: number;
    errorCount: number;
  };
}

export class DepartmentCsvRowDto {
  @ApiProperty({
    example: 'CS',
    description: 'Department code (2-4 characters)',
  })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @Matches(/^[A-Z]{2,4}$/, { message: 'Code must be 2-4 uppercase letters' })
  code: string;

  @ApiProperty({ example: 'Computer Science', description: 'Department name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;
}

export class CourseCsvRowDto {
  @ApiProperty({ example: 'CS101', description: 'Course code' })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  @Matches(/^[A-Z]{2,4}\d{3}$/, {
    message:
      'Code must follow format: 2-4 letters followed by 3 digits (e.g., CS101)',
  })
  code: string;

  @ApiProperty({
    example: 'Introduction to Programming',
    description: 'Course name',
  })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    enum: Level,
    example: 'LEVEL_100',
    description: 'Course level',
  })
  @IsEnum(Level, {
    message:
      'Level must be LEVEL_100, LEVEL_200, LEVEL_300, LEVEL_400, or LEVEL_500',
  })
  level: Level;

  @ApiProperty({ example: 3, description: 'Credit hours (1-6)' })
  @IsInt({ message: 'Credits must be an integer' })
  @Min(1, { message: 'Credits must be at least 1' })
  @Max(6, { message: 'Credits cannot exceed 6' })
  credits: number;

  @ApiProperty({ example: 'CS', description: 'Department code' })
  @IsString({ message: 'Department code must be a string' })
  @IsNotEmpty({ message: 'Department code is required' })
  @Matches(/^[A-Z]{2,4}$/, {
    message: 'Department code must be 2-4 uppercase letters',
  })
  departmentCode: string;

  @ApiProperty({
    example: 'lecturer@university.edu',
    description: 'Email of the lecturer taking the course',
  })
  @IsString({ message: 'Lecturer email must be a string' })
  @IsNotEmpty({ message: 'Lecturer email is required' })
  lecturerEmail: string;
}

export class ScheduleCsvRowDto {
  @ApiProperty({ example: 'CS101', description: 'Course code' })
  @IsString({ message: 'Course code must be a string' })
  @IsNotEmpty({ message: 'Course code is required' })
  @Matches(/^[A-Z]{2,4}\d{3}$/, {
    message:
      'Course code must follow format: 2-4 letters followed by 3 digits (e.g., CS101)',
  })
  courseCode: string;

  @ApiProperty({
    enum: DayOfWeek,
    example: 'MONDAY',
    description: 'Day of the week',
  })
  @IsEnum(DayOfWeek, {
    message:
      'Day of week must be MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, or SUNDAY',
  })
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '08:00', description: 'Start time in HH:MM format' })
  @IsString({ message: 'Start time must be a string' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format (24-hour)',
  })
  startTime: string;

  @ApiProperty({ example: '09:30', description: 'End time in HH:MM format' })
  @IsString({ message: 'End time must be a string' })
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format (24-hour)',
  })
  endTime: string;

  @ApiProperty({
    enum: VenueType,
    example: VenueType.LECTURE_HALL_1,
    description: 'Venue for the class',
  })
  @IsEnum(VenueType, {
    message: 'Venue must be a valid venue type',
  })
  venue: VenueType;
}
