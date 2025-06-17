import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateComplaintDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'Computer Science' })
  @IsString({ message: 'Department must be a string' })
  @IsNotEmpty({ message: 'Department is required' })
  department: string;

  @ApiProperty({ example: 'Lecture' })
  @IsString({ message: 'Subject must be a string' })
  @IsNotEmpty({ message: 'Subject is required' })
  subject: string;

  @ApiProperty({ example: 'I have a problem with the lecture' })
  @IsString({ message: 'Message must be a string' })
  @IsNotEmpty({ message: 'Message is required' })
  message: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  userId?: string;
}
