import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaService } from '../database/prisma.service';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService, PrismaService],
})
export class SchedulesModule {}
