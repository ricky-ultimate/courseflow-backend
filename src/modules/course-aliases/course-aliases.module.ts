import { Module } from '@nestjs/common';
import { CourseAliasesService } from './course-aliases.service';
import { CourseAliasesController } from './course-aliases.controller';

@Module({
  controllers: [CourseAliasesController],
  providers: [CourseAliasesService],
  exports: [CourseAliasesService],
})
export class CourseAliasesModule {}
