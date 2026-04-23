import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  IsEnum,
  IsNotEmpty,
  MinLength,
  Matches,
  ValidateIf,
} from 'class-validator';
import { College, Role } from '../../../generated/prisma';

export class CreateUserDto {
  @ApiProperty({ example: 'CS/2023/001' })
  @IsString()
  @IsNotEmpty()
  matricNO: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ required: false, example: 'John Doe' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ enum: Role, default: Role.STUDENT })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ required: false, example: '+1234567890' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 'CSC',
    description: 'Required for STUDENT, LECTURER, and HOD roles',
  })
  @IsString()
  @Matches(/^[A-Z]{2,4}$/, {
    message: 'Department code must be 2-4 uppercase letters',
  })
  @ValidateIf(
    (o: CreateUserDto) =>
      o.role === Role.STUDENT ||
      o.role === Role.LECTURER ||
      o.role === Role.HOD ||
      o.role === undefined,
  )
  @IsNotEmpty()
  departmentCode?: string;

  @ApiProperty({
    enum: College,
    required: false,
    description: 'Required when role is COLLEGE_ADMIN',
  })
  @IsEnum(College)
  @ValidateIf((o: CreateUserDto) => o.role === Role.COLLEGE_ADMIN)
  @IsNotEmpty()
  @IsOptional()
  collegeCode?: College;
}
