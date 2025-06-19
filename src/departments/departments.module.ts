import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { CsvService } from '../common/services/csv.service';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, CsvService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
