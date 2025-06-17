import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Schedule, Role, Level } from '../generated/prisma';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Schedules')
@Controller('schedules')
@CrudRoles({
  entity: 'schedule',
  create: [Role.ADMIN, Role.LECTURER],
  read: [],
  update: [Role.ADMIN, Role.LECTURER],
  delete: [Role.ADMIN],
})
export class SchedulesController extends BaseController<
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto
> {
  constructor(private readonly schedulesService: SchedulesService) {
    super(schedulesService);
  }

  @Get('course/:courseCode')
  @Public()
  @ApiOperation({ summary: 'Get schedules by course' })
  findByCourse(@Param('courseCode') courseCode: string) {
    return this.schedulesService.findByCourse(courseCode);
  }

  @Get('department/:departmentCode')
  @Public()
  @ApiOperation({ summary: 'Get schedules by department' })
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.schedulesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @Public()
  @ApiOperation({ summary: 'Get schedules by level' })
  findByLevel(@Param('level') level: Level) {
    return this.schedulesService.findByLevel(level);
  }
}
