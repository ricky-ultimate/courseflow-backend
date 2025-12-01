import { Module } from '@nestjs/common';
import { LecturersService } from './lecturers.service';
import { LecturersController } from './lecturers.controller';
import { LecturerRepository } from './repositories/lecturer.repository';

@Module({
  controllers: [LecturersController],
  providers: [LecturersService, LecturerRepository],
  exports: [LecturersService, LecturerRepository],
})
export class LecturersModule {}
