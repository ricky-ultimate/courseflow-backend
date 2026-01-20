import { PartialType } from '@nestjs/swagger';
import { CreateAcademicSessionDto } from './create-academic-session.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAcademicSessionDto extends PartialType(CreateAcademicSessionDto) {
  @ApiProperty({ required: false, example: true, description: 'Whether the session is active' })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
