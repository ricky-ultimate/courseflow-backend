import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { Level } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CourseFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by Department Code' })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiPropertyOptional({ enum: Level, description: 'Filter by Course Level' })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({
    description: 'Search by name or code (partial match)',
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'Filter by lecturer ID' })
  @IsOptional()
  @IsString()
  lecturerId?: string;

  @ApiPropertyOptional({ description: 'Minimum credits', minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  minCredits?: number;

  @ApiPropertyOptional({ description: 'Maximum credits', maximum: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Max(6)
  maxCredits?: number;
}
