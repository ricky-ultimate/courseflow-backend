import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { ScheduleRepository } from './repositories/schedule.repository';
import { CourseRepository } from '../courses/repositories/course.repository';
import { CsvService } from '../common/services/csv.service';

@Module({
  controllers: [SchedulesController],
  providers: [
    SchedulesService,
    ScheduleRepository,
    CourseRepository,
    CsvService,
  ],
  exports: [SchedulesService],
})
export class SchedulesModule {}
