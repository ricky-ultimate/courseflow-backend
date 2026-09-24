import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { College, Level, Semester } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class ExamFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by academic session ID' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiPropertyOptional({ enum: Semester })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @ApiPropertyOptional({
    description: 'Filter by the exam course department code',
  })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiPropertyOptional({ enum: Level })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({
    enum: College,
    description: 'Filter by exam target college',
  })
  @IsOptional()
  @IsEnum(College)
  college?: College;

  @ApiPropertyOptional({ description: 'Filter by exact course code' })
  @IsOptional()
  @IsString()
  courseCode?: string;
}
