import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CourseRepository } from './repositories/course.repository';
import { CsvService } from '../common/services/csv.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CourseRepository, CsvService],
})
export class CoursesModule {}
