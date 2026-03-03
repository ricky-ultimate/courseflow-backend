import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsBoolean,
  Matches,
} from 'class-validator';
import { DayOfWeek } from '../../../generated/prisma';
import {
  IsTimeFormat,
  IsEndTimeAfterStartTime,
} from '../../../common/validators/time.validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 'CSC101' })
  @IsString({ message: 'Course code must be a string' })
  @IsNotEmpty({ message: 'Course code is required' })
  @Matches(/^[A-Z]{2,4}\d{3}$/, {
    message: 'Course code must follow format: 2-4 letters followed by 3 digits',
  })
  courseCode: string;

  @ApiProperty({ enum: DayOfWeek, example: DayOfWeek.MONDAY })
  @IsEnum(DayOfWeek, { message: 'Invalid day of week' })
  dayOfWeek: DayOfWeek;

  @ApiProperty({ example: '09:00' })
  @IsTimeFormat({ message: 'Start time must be in HH:MM format' })
  startTime: string;

  @ApiProperty({ example: '11:00' })
  @IsTimeFormat({ message: 'End time must be in HH:MM format' })
  @IsEndTimeAfterStartTime('startTime')
  endTime: string;

  @ApiProperty({
    required: false,
    default: false,
    description:
      'Pin this schedule so auto-generation never moves or deletes it. ' +
      'Automatically set to true for university-wide (general) courses.',
  })
  @IsBoolean()
  @IsOptional()
  isFixed?: boolean;
}
