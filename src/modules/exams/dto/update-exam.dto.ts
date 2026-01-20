import { PartialType } from '@nestjs/swagger';
import { CreateExamDto } from './create-exam.dto';

export class UpdateCourseDto extends PartialType(CreateExamDto) {}
