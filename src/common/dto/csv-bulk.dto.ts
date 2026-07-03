import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  Matches,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Level, Semester, DayOfWeek } from '../../generated/prisma';

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
  aliasWarnings?: string[];
  summary: {
    totalRows: number;
    successCount: number;
    errorCount: number;
  };
}

export interface FileBulkResult<T> {
  fileName: string;
  result: BulkOperationResult<T>;
}

export interface MultiFileBulkOperationResult<T> {
  success: boolean;
  files: FileBulkResult<T>[];
  summary: {
    totalFiles: number;
    totalRows: number;
    successCount: number;
    errorCount: number;
  };
}

export class DepartmentCsvRowDto {
  @ApiProperty({ example: 'CS' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,4}$/, { message: 'Code must be 2-4 uppercase letters' })
  code!: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class CourseCsvRowDto {
  @ApiProperty({ example: 'CSC101' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,4}\d{3}$/, {
    message: 'Code must follow format: 2-4 letters followed by 3 digits',
  })
  code!: string;

  @ApiProperty({ example: 'Introduction to Programming' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level!: Level;

  @ApiProperty({ enum: Semester })
  @IsEnum(Semester)
  semester!: Semester;

  @ApiProperty({ example: 3 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(6)
  credits!: number;

  @ApiProperty({ example: 'CSC' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,4}$/)
  departmentCode!: string;

  @ApiProperty({ example: 'lecturer@university.edu' })
  @IsString()
  @IsNotEmpty()
  lecturerEmail!: string;

  @ApiProperty({
    required: false,
    example: 'CSC413,CSE409',
    description:
      'Comma-separated course codes to link as aliases. Non-existent codes are skipped and returned as warnings.',
  })
  @IsString()
  @IsOptional()
  aliasOfCodes?: string;
}

export class ScheduleCsvRowDto {
  @ApiProperty({ example: 'CSC101' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,4}\d{3}$/, {
    message: 'Course code must follow format: 2-4 letters followed by 3 digits',
  })
  courseCode!: string;

  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek!: DayOfWeek;

  @ApiProperty({ example: '09:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Start time must be in HH:MM format',
  })
  startTime!: string;

  @ApiProperty({ example: '11:00' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'End time must be in HH:MM format',
  })
  endTime!: string;
}
