import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  IsOptional,
} from 'class-validator';
import {
  IsTimeFormat,
  IsEndTimeAfterStartTime,
} from '../../../common/validators/time.validator';
import { College, VenueType } from '../../../generated/prisma';

export class CreateExamDto {
  @ApiProperty({ example: 'CSC201' })
  @IsString()
  @IsNotEmpty()
  courseCode: string;

  @ApiProperty({ example: '2025-12-15T00:00:00.000Z' })
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '09:00' })
  @IsTimeFormat()
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsTimeFormat()
  @IsEndTimeAfterStartTime('startTime')
  endTime: string;

  @ApiProperty({
    enum: VenueType,
    example: VenueType.UNIVERSITY_ICT_CENTER,
    description: 'Venue for the exam. 100L/General courses must use ICT venues.',
  })
  @IsEnum(VenueType)
  @IsNotEmpty()
  venue: VenueType;

  @ApiProperty({ example: 50, description: 'Number of students in this batch' })
  @IsInt()
  @Min(1)
  studentCount: number;

  @ApiProperty({
    enum: College,
    required: false,
    description: 'Required if scheduling a General Course (GST/PIF)',
  })
  @IsEnum(College)
  @IsOptional()
  targetCollege?: College;

  @ApiProperty({ required: false, example: 'Dr. Smith, Prof. Jones' })
  @IsString()
  @IsOptional()
  invigilators?: string;
}
