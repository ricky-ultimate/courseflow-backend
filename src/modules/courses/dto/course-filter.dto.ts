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

  @ApiPropertyOptional({ enum: Level, description: 'Filter by Course Level' })
  @IsOptional()
  @IsEnum(Level)
  level?: Level;

  @ApiPropertyOptional({ enum: Semester, description: 'Filter by Semester' })
  @IsOptional()
  @IsEnum(Semester)
  semester?: Semester;

  @ApiPropertyOptional({
    description: 'Filter by General Course status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isGeneral?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name or code (partial match)',
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ description: 'Filter by lecturer Email' })
  @IsOptional()
  @IsString()
  lecturerEmail?: string;

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
