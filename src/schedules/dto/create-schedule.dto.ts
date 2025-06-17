import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { DayOfWeek, ClassType } from '../../generated/prisma';

export class CreateScheduleDto {
  @ApiProperty({example: 'CS101'})
  @IsString({message: 'Course code must be a string'})
  @IsNotEmpty({message: 'Course code is required'})
  courseCode: string;

  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({example: '08:00'})
  @IsString({message: 'Start time must be a string'})
  @IsNotEmpty({message: 'Start time is required'})
  startTime: string;

  @ApiProperty({example: '09:00'})
  @IsString({message: 'End time must be a string'})
  @IsNotEmpty({message: 'End time is required'})
  endTime: string;

  @ApiProperty({example: 'Room 101'})
  @IsString({message: 'Venue must be a string'})
  @IsNotEmpty({message: 'Venue is required'})
  venue: string;

  @ApiProperty({ enum: ClassType, default: 'LECTURE' })
  @IsEnum(ClassType)
  type: ClassType;
}
