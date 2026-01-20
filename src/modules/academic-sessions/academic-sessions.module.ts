import { Module } from '@nestjs/common';
import { AcademicSessionsService } from './academic-sessions.service';
import { AcademicSessionsController } from './academic-sessions.controller';

@Module({
  controllers: [AcademicSessionsController],
  providers: [AcademicSessionsService],
  exports: [AcademicSessionsService],
})
export class AcademicSessionsModule {}
