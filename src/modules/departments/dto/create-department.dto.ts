import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({ example: 'Computer Science' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'CS' })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @ApiProperty({
    required: false,
    example: 'Study of computation, information processing, and design of computer systems',
    description: 'Department description',
  })
  @IsString({ message: 'Description must be a string' })
  @IsOptional()
  description?: string;

  @ApiProperty({
    required: false,
    example: 'user_id_here',
    description: 'ID of the user who will be the Head of Department (must be LECTURER or ADMIN)',
  })
  @IsString({ message: 'HOD ID must be a string' })
  @IsOptional()
  hodId?: string;
}
