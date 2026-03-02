import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetSchedules,
  ApiGetScheduleById,
  ApiCreateSchedule,
  ApiUpdateSchedule,
  ApiDeleteSchedule,
  ApiGetScheduleStatistics,
  ApiGenerateSchedules,
} from './decorators/schedule-api.decorator';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleFilterDto } from './dto/schedule-filter.dto';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Schedule, Role } from '../../generated/prisma';

@ApiTags('Schedules')
@Controller('schedules')
@CrudRoles({
  entity: 'schedule',
  create: [Role.ADMIN, Role.HOD],
  read: [],
  update: [Role.ADMIN, Role.HOD],
  delete: [Role.ADMIN, Role.HOD],
})
export class SchedulesController extends BaseController<
  Schedule,
  CreateScheduleDto,
  UpdateScheduleDto
> {
  constructor(private readonly schedulesService: SchedulesService) {
    super(schedulesService);
  }

  @Post('generate')
  @ApiGenerateSchedules()
  generate(@Body() dto: GenerateScheduleDto) {
    return this.schedulesService.generateSchedules(dto);
  }

  @Get()
  @ApiGetSchedules()
  findAll(@Query() query?: ScheduleFilterDto) {
    return this.schedulesService.findAll(query);
  }

  @Get('statistics')
  @ApiGetScheduleStatistics()
  getStatistics() {
    return this.schedulesService.getScheduleStatistics();
  }

  @Get(':id')
  @ApiGetScheduleById()
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Post()
  @ApiCreateSchedule()
  create(@Body() createDto: CreateScheduleDto) {
    return this.schedulesService.create(createDto);
  }

  @Patch(':id')
  @ApiUpdateSchedule()
  update(@Param('id') id: string, @Body() updateDto: UpdateScheduleDto) {
    return this.schedulesService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiDeleteSchedule()
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
