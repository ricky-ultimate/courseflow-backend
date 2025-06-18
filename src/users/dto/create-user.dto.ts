import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { Role } from '../../generated/prisma';

export class CreateUserDto {
  @ApiProperty({ example: 'CS/2023/001' })
  @IsString({ message: 'Matric number must be a string' })
  @IsNotEmpty({ message: 'Matric number is required' })
  matricNO: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString({ message: 'Name must be a string' })
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;
}
