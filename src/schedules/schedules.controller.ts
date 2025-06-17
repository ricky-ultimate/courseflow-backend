import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BaseController } from '../common/controllers/base.controller';
import { Schedule, Role, Level } from '../generated/prisma';

@ApiTags('Schedules')
@Controller('schedules')
export class SchedulesController extends BaseController<
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto
> {
  constructor(private readonly schedulesService: SchedulesService) {
    super(schedulesService, {
      entity: 'schedule',
      createRoles: [Role.ADMIN, Role.LECTURER],
      updateRoles: [Role.ADMIN, Role.LECTURER],
      deleteRoles: [Role.ADMIN],
    });
  }

  @Get('course/:courseCode')
  @ApiOperation({ summary: 'Get schedules by course' })
  findByCourse(@Param('courseCode') courseCode: string) {
    return this.schedulesService.findByCourse(courseCode);
  }

  @Get('department/:departmentCode')
  @ApiOperation({ summary: 'Get schedules by department' })
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.schedulesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @ApiOperation({ summary: 'Get schedules by level' })
  findByLevel(@Param('level') level: Level) {
    return this.schedulesService.findByLevel(level);
  }
}
