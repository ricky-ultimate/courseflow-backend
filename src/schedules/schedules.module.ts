import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { CsvService } from '../common/services/csv.service';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, CsvService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
