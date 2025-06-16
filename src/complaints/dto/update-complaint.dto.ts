import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ComplaintStatus } from '../../generated/prisma';

export class UpdateComplaintDto {
  @ApiProperty({ enum: ComplaintStatus, required: false })
  @IsEnum(ComplaintStatus)
  @IsOptional()
  status?: ComplaintStatus;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  resolvedBy?: string;
}
