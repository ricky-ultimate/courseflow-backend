import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Level, Semester } from '../../../generated/prisma';
import {
  ScheduleAssignment,
  UnscheduledCourse,
} from '../scheduler/scheduler.engine';

export class GenerateScheduleDto {
  @ApiProperty({ enum: Semester, example: Semester.FIRST })
  @IsEnum(Semester)
  semester: Semester;

  @ApiPropertyOptional({
    example: 'clxyz123abc456def789',
    description: 'Session ID to generate for. Defaults to the active session.',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    example: 'CSC',
    description:
      'Department code to scope generation to. Required for HODs. Admins may omit to generate for all unlocked departments.',
  })
  @IsString()
  @IsOptional()
  departmentCode?: string;

  @ApiPropertyOptional({
    enum: Level,
    example: Level.LEVEL_300,
    description:
      'Restrict generation to a single level within the selected department scope.',
  })
  @IsEnum(Level)
  @IsOptional()
  level?: Level;

  @ApiPropertyOptional({
    example: 'CSE',
    description:
      'Restrict generation to a specific programme (course code prefix) within the selected department. Only valid when departmentCode is also provided.',
  })
  @IsString()
  @IsOptional()
  programme?: string;
}

export interface GenerateScheduleResult {
  sessionId: string;
  sessionName: string;
  semester: Semester;
  departmentCode: string | null;
  programme: string | null;
  level: Level | null;
  totalCourses: number;
  scheduledCount: number;
  failedCount: number;
  preservedOverrides: number;
  skippedLockedDepartments: number;
  scheduledCourses: ScheduleAssignment[];
  unscheduledCourses: UnscheduledCourse[];
  success: boolean;
}

export interface BatchGenerateScheduleResult {
  sessionId: string;
  sessionName: string;
  semester: Semester;
  programme: string | null;
  totalDepartments: number;
  processedDepartments: number;
  skippedLockedDepartments: number;
  totalCourses: number;
  scheduledCount: number;
  failedCount: number;
  preservedOverrides: number;
  scheduledCourses: ScheduleAssignment[];
  unscheduledCourses: UnscheduledCourse[];
  errors: Array<{ departmentCode: string; message: string }>;
  success: boolean;
}
