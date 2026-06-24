import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

export class RecommendUniversitySlotsDto {
  @ApiProperty({ type: [String], example: ['GST101', 'GST103'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  courseCodes: string[];
}

export interface RecommendedSlotResult {
  courseCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  hasConflict: boolean;
}
