import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { DayOfWeek, ClassType, Level, Semester } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ScheduleFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by Course Code' })
  @IsOptional()
  @IsString()
  courseCode?: string;

  @ApiPropertyOptional({
    description: 'Filter by Department Code (via Course)',
  })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiPropertyOptional({ enum: Level, description: 'Filter by Course Level' })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({ enum: Semester, description: 'Filter by Semester' })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @ApiPropertyOptional({ description: 'Filter by Academic Session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({
    enum: DayOfWeek,
    description: 'Filter by Day of Week',
  })
  @IsOptional()
  @IsEnum(DayOfWeek)
  dayOfWeek?: DayOfWeek;

  @ApiPropertyOptional({ description: 'Filter by Venue (partial match)' })
  @IsOptional()
  @IsString()
  venue?: string;

  @ApiPropertyOptional({ enum: ClassType, description: 'Filter by Class Type' })
  @IsOptional()
  @IsEnum(ClassType)
  type?: ClassType;

  @ApiPropertyOptional({
    description: 'Start time (HH:MM) for range filtering',
  })
  @IsOptional()
  @IsString()
  startTime?: string;

  @ApiPropertyOptional({ description: 'End time (HH:MM) for range filtering' })
  @IsOptional()
  @IsString()
  endTime?: string;
}
