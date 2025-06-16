import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum } from 'class-validator';
import { Level } from '../../generated/prisma';

export class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: Level })
  @IsEnum(Level)
  level: Level;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  departmentCode: string;
}
