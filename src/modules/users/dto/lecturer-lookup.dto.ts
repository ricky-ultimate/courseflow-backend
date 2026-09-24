import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class LecturerLookupDto {
  @ApiPropertyOptional({
    description: 'Restrict results to a department code (Admin only)',
  })
  @IsOptional()
  @IsString()
  departmentCode?: string;

  @ApiPropertyOptional({ description: 'Search by name or email' })
  @IsOptional()
  @IsString()
  searchTerm?: string;
}
