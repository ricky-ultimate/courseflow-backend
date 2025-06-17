import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateDepartmentDto {
  @ApiProperty({example: 'Computer Science'})
  @IsString({message: 'Name must be a string'})
  @IsNotEmpty({message: 'Name is required'})
  name: string;

  @ApiProperty({example: 'CS'})
  @IsString({message: 'Code must be a string'})
  @IsNotEmpty({message: 'Code is required'})
  code: string;
}
