import { Module } from '@nestjs/common';
import { DepartmentsService } from './departments.service';
import { DepartmentsController } from './departments.controller';
import { DepartmentRepository } from './repositories/department.repository';
import { CsvService } from '../common/services/csv.service';

@Module({
  controllers: [DepartmentsController],
  providers: [DepartmentsService, DepartmentRepository, CsvService],
  exports: [DepartmentsService],
})
export class DepartmentsModule {}
