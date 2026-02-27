import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Role } from '../../../generated/prisma';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class UserFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: Role,
    description: 'Filter by role (e.g. LECTURER, STUDENT, HOD, ADMIN)',
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Filter by department code' })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;
}
