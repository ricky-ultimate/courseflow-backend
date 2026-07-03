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
  IsArray,
  MaxLength,
  Matches,
} from 'class-validator';
import { Level, Semester } from '../../../generated/prisma';

export class CreateCourseDto {
  @ApiProperty({ example: 'CSC101' })
  @IsString()
  @IsNotEmpty()
  code!: string;

  @ApiProperty({ example: 'Introduction to Computer Science' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  overview?: string;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level!: Level;

  @ApiProperty({ enum: Semester, default: Semester.FIRST })
  @IsEnum(Semester)
  semester: Semester = Semester.FIRST;

  @ApiProperty({ example: 3 })
  @IsInt()
  @Min(1)
  @Max(6)
  credits!: number;

  @ApiProperty({ example: 'CSC' })
  @IsString()
  @IsNotEmpty()
  departmentCode!: string;

  @ApiProperty({
    required: false,
    example: 'clxyz123abc456def789',
    description:
      'Optional ID of the lecturer (User with role LECTURER or HOD). A course can be created without a lecturer and one can be assigned later.',
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

  @ApiProperty({
    required: false,
    example: ['CSC413', 'CSE409'],
    description:
      'Course codes to link as aliases at creation time. Only codes that resolve to existing active courses will be linked. Non-existent codes are returned as warnings and can be linked later via the course-aliases endpoint.',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @Matches(/^[A-Z]{2,4}\d{3}$/, { each: true })
  @IsOptional()
  aliasOf?: string[];
}
