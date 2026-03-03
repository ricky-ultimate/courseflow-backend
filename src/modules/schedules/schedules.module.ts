import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { ScheduleRepository } from './repositories/schedule.repository';
import { SchedulerEngine } from './scheduler/scheduler.engine';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, ScheduleRepository, SchedulerEngine],
  exports: [SchedulesService],
})
export class SchedulesModule {}
