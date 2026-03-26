import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { College, Level, Semester } from '../../../generated/prisma';

export class GenerateExamTimetableDto {
  @ApiProperty({ enum: Semester, example: Semester.FIRST })
  @IsEnum(Semester)
  semester: Semester;

  @ApiPropertyOptional({
    example: 'clxyz123abc456def789',
    description: 'Session ID. Defaults to the active session.',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiPropertyOptional({
    example: 'CSC',
    description: 'Restrict generation to a single department.',
  })
  @IsString()
  @IsOptional()
  departmentCode?: string;

  @ApiPropertyOptional({
    enum: Level,
    description: 'Restrict generation to a single level.',
  })
  @IsEnum(Level)
  @IsOptional()
  level?: Level;

  @ApiPropertyOptional({
    enum: College,
    description: 'Restrict generation to a single college.',
  })
  @IsEnum(College)
  @IsOptional()
  college?: College;
}

export interface GenerateExamTimetableResult {
  sessionId: string;
  sessionName: string;
  semester: Semester;
  departmentCode: string | null;
  level: Level | null;
  college: College | null;
  totalCourses: number;
  scheduledExams: number;
  skippedCourses: string[];
}
