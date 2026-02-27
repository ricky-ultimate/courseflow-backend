import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { Level, Semester } from '../../../generated/prisma';

export class CreateCourseDto {
  @ApiProperty({ example: 'CSC101' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 'Introduction to Computer Science' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  overview?: string;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level: Level;

  @ApiProperty({ enum: Semester, default: Semester.FIRST })
  @IsEnum(Semester)
  semester: Semester = Semester.FIRST;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(6)
  credits: number;

  @ApiProperty({ example: 'CSC' })
  @IsString()
  @IsNotEmpty()
  departmentCode: string;

  @ApiProperty({
    example: 'clxyz123abc456def789',
    description: 'ID of the lecturer (User with role LECTURER or HOD)',
  })
  @IsString()
  @IsOptional()
  lecturerId?: string;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isGeneral?: boolean;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;
}
