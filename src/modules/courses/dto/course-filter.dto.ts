import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { Level, Semester } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class CourseFilterDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Filter by Department Code' })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiPropertyOptional({ enum: Level })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({ enum: Semester })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @ApiPropertyOptional({ description: 'Filter by general course status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isGeneral?: boolean;

  @ApiPropertyOptional({
    description: 'Include general courses when filtering by department',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  includeGeneral?: boolean;

  @ApiPropertyOptional({ description: 'Search by name or code' })
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
