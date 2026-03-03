import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Semester } from '../../../generated/prisma';

export class GenerateScheduleDto {
  @ApiProperty({
    enum: Semester,
    example: Semester.FIRST,
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

  @ApiPropertyOptional({
    example: 'CSC',
    description:
      'Department code to scope generation to. Required for HODs. Admins may omit to generate for all unlocked departments.',
  })
  @IsString()
  @IsOptional()
  departmentCode?: string;
}

export interface GenerateScheduleResult {
  sessionId: string;
  sessionName: string;
  semester: Semester;
  departmentCode: string | null;
  totalCourses: number;
  scheduledCourses: number;
  preservedOverrides: number;
  skippedLockedDepartments: number;
}
