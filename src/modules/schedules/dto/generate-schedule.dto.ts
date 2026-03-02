import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Semester } from '../../../generated/prisma';

export class GenerateScheduleDto {
  @ApiProperty({
    enum: Semester,
    example: Semester.FIRST,
    description: 'The semester to generate schedules for',
  })
  @IsEnum(Semester)
  semester: Semester;

  @ApiPropertyOptional({
    example: 'clxyz123abc456def789',
    description: 'Session ID to generate for. Defaults to the active session.',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;
}

export interface GenerateScheduleResult {
  sessionId: string;
  sessionName: string;
  semester: Semester;
  totalCourses: number;
  scheduledCourses: number;
  preservedOverrides: number;
}
