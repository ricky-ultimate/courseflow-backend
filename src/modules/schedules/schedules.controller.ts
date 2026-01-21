import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetSchedules,
  ApiGetScheduleById,
  ApiCreateSchedule,
  ApiUpdateSchedule,
  ApiDeleteSchedule,
  ApiGetScheduleStatistics,
  ApiBulkCreateSchedules,
  ApiDownloadScheduleTemplate,
} from './decorators/schedule-api.decorator';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleFilterDto } from './dto/schedule-filter.dto';
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

  @Get('bulk/template')
  @ApiDownloadScheduleTemplate()
  downloadCsvTemplate(@Res() res: Response) {
    const template = this.schedulesService.generateCsvTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=schedules-template.csv',
    );
    res.send(template);
  }

  @Post('bulk/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBulkCreateSchedules()
  async bulkCreateFromCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new Error('File must be a CSV');
    }

    return this.schedulesService.bulkCreateFromCsv(file.buffer);
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
