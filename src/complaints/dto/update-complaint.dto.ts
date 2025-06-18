import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ComplaintStatus } from '../../generated/prisma';

export class UpdateComplaintDto {
  @ApiProperty({
    enum: ComplaintStatus,
    required: false,
    description: 'Status of the complaint',
    example: 'IN_PROGRESS',
  })
  @IsEnum(ComplaintStatus, {
    message: 'Status must be one of: PENDING, IN_PROGRESS, RESOLVED, CLOSED',
  })
  status: ComplaintStatus;

  @ApiProperty({
    required: false,
    description: 'Email or identifier of the person who resolved the complaint',
    example: 'admin@university.edu',
  })
  @IsString()
  @IsOptional()
  resolvedBy?: string;
}
