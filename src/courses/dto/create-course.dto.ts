import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsInt, Min, Max } from 'class-validator';
import { Level } from '../../generated/prisma';

export class CreateCourseDto {
  @ApiProperty({ example: 'CS101' })
  @IsString({ message: 'Code must be a string' })
  @IsNotEmpty({ message: 'Code is required' })
  code: string;

  @ApiProperty({ example: 'Introduction to Computer Science' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level: Level;

  @ApiProperty({ example: 3, description: 'Number of credits for the course (1-6)' })
  @IsInt({ message: 'Credits must be an integer' })
  @Min(1, { message: 'Credits must be at least 1' })
  @Max(6, { message: 'Credits cannot exceed 6' })
  credits: number;

  @ApiProperty({ example: 'CS' })
  @IsString({ message: 'Department code must be a string' })
  @IsNotEmpty({ message: 'Department code is required' })
  departmentCode: string;
}
