import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { College } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class DepartmentFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name or code (partial match)',
  })
  @IsOptional()
  @IsString()
  searchTerm?: string;

  @ApiPropertyOptional({ enum: College, description: 'Filter by college' })
  @IsOptional()
  @IsEnum(College)
  college?: College;

  @ApiPropertyOptional({
    description: 'Filter only departments with active courses',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  hasCourses?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only departments without active courses',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  withoutCourses?: boolean;
}
