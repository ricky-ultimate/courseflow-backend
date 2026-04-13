import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class CreateCourseAliasDto {
  @ApiProperty({ example: 'CSC413', description: 'Primary course code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,4}\d{3}$/)
  primaryCode: string;

  @ApiProperty({ example: 'CSE409', description: 'Alias course code' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Z]{2,4}\d{3}$/)
  aliasCode: string;
}
