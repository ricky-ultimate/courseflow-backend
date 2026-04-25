import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ComplaintStatus } from '../../../generated/prisma';

export class UpdateComplaintDto {
  @ApiProperty({
    enum: ComplaintStatus,
    required: false,
    description: 'New status for the complaint',
    example: 'IN_PROGRESS',
  })
  @IsEnum(ComplaintStatus, {
    message: 'Status must be one of: PENDING, IN_PROGRESS, RESOLVED, CLOSED',
  })
  @IsOptional()
  status?: ComplaintStatus;
}
