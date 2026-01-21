import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateVenueDto {
  @ApiProperty({ example: 'Lecture Hall 3' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 150, description: 'Maximum student capacity' })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiProperty({
    example: false,
    description: 'Is this an ICT center suitable for CBT exams?',
  })
  @IsBoolean()
  @IsOptional()
  isIct?: boolean;
}
