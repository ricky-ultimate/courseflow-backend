import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  MaxLength,
  Matches,
} from 'class-validator';
import { DayOfWeek, ClassType } from '../../generated/prisma';
import {
  IsTimeFormat,
  IsEndTimeAfterStartTime,
} from '../../common/validators/time.validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'CS101' })
  @IsString({ message: 'Course code must be a string' })
  @IsNotEmpty({ message: 'Course code is required' })
  @Matches(/^[A-Z]{2,4}\d{3}$/, {
    message:
      'Course code must follow format: 2-4 letters followed by 3 digits (e.g., CS101)',
  })
  courseCode: string;

  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek, { message: 'Invalid day of week' })
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '08:00' })
  @IsTimeFormat({ message: 'Start time must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '09:00' })
  @IsTimeFormat({ message: 'End time must be in HH:MM format' })
  @IsEndTimeAfterStartTime('startTime')
  endTime: string;

  @ApiProperty({ example: 'Room 101' })
  @IsString({ message: 'Venue must be a string' })
  @IsNotEmpty({ message: 'Venue is required' })
  @MaxLength(100, { message: 'Venue cannot exceed 100 characters' })
  venue: string;

  @ApiProperty({ enum: ClassType, default: ClassType.LECTURE })
  @IsEnum(ClassType, { message: 'Invalid class type' })
  type: ClassType = ClassType.LECTURE;
}
