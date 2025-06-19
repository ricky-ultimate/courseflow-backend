import { PartialType } from '@nestjs/swagger';
import { CreateVerificationCodeDto } from './create-verification-code.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateVerificationCodeDto extends PartialType(CreateVerificationCodeDto) {
  @ApiProperty({ 
    required: false,
    example: true,
    description: 'Whether the verification code is active'
  })
  @IsBoolean({ message: 'isActive must be a boolean' })
  @IsOptional()
  isActive?: boolean;
}
