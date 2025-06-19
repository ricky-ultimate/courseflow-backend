import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CsvService } from '../common/services/csv.service';

@Module({
  controllers: [CoursesController],
  providers: [CoursesService, CsvService],
})
export class CoursesModule {}
