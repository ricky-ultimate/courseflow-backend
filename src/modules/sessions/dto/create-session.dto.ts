import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateSessionDto {
  @ApiProperty({
    example: '2025/2026',
    description: 'Academic session name in format YYYY/YYYY'
  })
  @IsString({ message: 'Session name must be a string' })
  @IsNotEmpty({ message: 'Session name is required' })
  @Matches(/^\d{4}\/\d{4}$/, {
    message: 'Session name must be in format YYYY/YYYY (e.g., 2025/2026)',
  })
  name: string;
}
