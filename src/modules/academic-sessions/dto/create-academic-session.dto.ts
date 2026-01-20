import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsDateString } from 'class-validator';

export class CreateAcademicSessionDto {
  @ApiProperty({ example: '2024/2025', description: 'Academic session name' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: '2024-09-01T00:00:00.000Z', description: 'Session start date' })
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'Start date is required' })
  startDate: string;

  @ApiProperty({ example: '2025-07-31T23:59:59.000Z', description: 'Session end date' })
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  @IsNotEmpty({ message: 'End date is required' })
  endDate: string;
}
