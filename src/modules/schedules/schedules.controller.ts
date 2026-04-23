import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  Req,
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
  ApiToggleScheduleFixed,
  ApiGenerateSchedulesBatch,
} from './decorators/schedule-api.decorator';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleFilterDto } from './dto/schedule-filter.dto';
import { GenerateScheduleDto } from './dto/generate-schedule.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';
import { Schedule, Role } from '../../generated/prisma';
import { AuthenticatedRequest } from '../../common/types/auth.types';

@ApiTags('Schedules')
@Controller('schedules')
@CrudRoles({
  create: [Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN],
  read: [],
  update: [Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN],
  delete: [Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN],
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
  @Roles(Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN)
  @SkipHodGuard()
  @ApiGenerateSchedules()
  async generate(
    @Body() dto: GenerateScheduleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedulesService.generateSchedules(dto, req.user);
  }

  @Post('generate/batch')
  @Roles(Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN)
  @SkipHodGuard()
  @ApiGenerateSchedulesBatch()
  async generateBatch(
    @Body() dto: GenerateScheduleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.schedulesService.generateSchedulesBatch(dto, req.user);
  }

  @Get()
  @ApiGetSchedules()
  findAll(@Query() query?: ScheduleFilterDto) {
    return this.schedulesService.findAll(query);
  }

  @Get('statistics')
  @SkipHodGuard()
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

  @Patch(':id/toggle-fixed')
  @Roles(Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN)
  @SkipHodGuard()
  @ApiToggleScheduleFixed()
  toggleFixed(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.schedulesService.toggleFixed(id, req.user);
  }

  @Delete(':id')
  @ApiDeleteSchedule()
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
