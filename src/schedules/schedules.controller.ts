import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Schedule, Role, Level } from '../generated/prisma';

@ApiTags('Schedules')
@ApiBearerAuth('JWT-auth')
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
  @ApiParam({
    name: 'level',
    enum: Level,
    description: 'Academic level',
    example: 'LEVEL_100',
  })
  findByLevel(@Param('level', new ParseEnumPipe(Level)) level: Level) {
    return this.schedulesService.findByLevel(level);
  }
  @Post()
  @ApiOperation({ summary: 'Create a new schedule' })
  @ApiBody({ type: CreateScheduleDto })
  create(@Body() createDto: CreateScheduleDto) {
    return this.schedulesService.create(createDto);
  }
}
