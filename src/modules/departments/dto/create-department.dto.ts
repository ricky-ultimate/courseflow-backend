import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsEnum,
} from 'class-validator';
import { College } from '../../../generated/prisma';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: 'CSC',
    description: 'Unique department code (2-4 uppercase letters)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,4}$/, { message: 'Code must be 2-4 uppercase letters' })
  code: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @ApiProperty({ enum: College, required: false, default: College.CBAS })
  @IsEnum(College)
  @IsOptional()
  college?: College;

  @ApiProperty({
    required: false,
    example: 'clxyz123abc456def789',
    description: 'ID of the user to assign as Head of Department',
  })
  @IsString()
  @IsOptional()
  hodId?: string;
}
