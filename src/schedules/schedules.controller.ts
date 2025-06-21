import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Patch,
  Delete,
  Query,
  ParseEnumPipe,
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
  ApiGetSchedulesByCourse,
  ApiGetSchedulesByDepartment,
  ApiGetSchedulesByLevel,
  ApiGetSchedulesByDayOfWeek,
  ApiGetSchedulesByVenue,
  ApiGetSchedulesByClassType,
  ApiGetScheduleStatistics,
  ApiBulkCreateSchedules,
  ApiDownloadScheduleTemplate,
} from './decorators/schedule-api.decorator';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import {
  Schedule,
  Role,
  Level,
  DayOfWeek,
  ClassType,
} from '../generated/prisma';
import { PaginationOptions } from '../common/interfaces/base-service.interface';

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

  @Get()
  @ApiGetSchedules()
  findAll(@Query() query?: PaginationOptions) {
    return this.schedulesService.findAll(query);
  }

  @Get(':id')
  @ApiGetScheduleById()
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
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

  @Get('course/:courseCode')
  @ApiGetSchedulesByCourse()
  findByCourse(@Param('courseCode') courseCode: string) {
    return this.schedulesService.findByCourse(courseCode);
  }

  @Get('department/:departmentCode')
  @ApiGetSchedulesByDepartment()
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.schedulesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @ApiGetSchedulesByLevel()
  findByLevel(@Param('level', new ParseEnumPipe(Level)) level: Level) {
    return this.schedulesService.findByLevel(level);
  }
  @Post()
  @ApiCreateSchedule()
  create(@Body() createDto: CreateScheduleDto) {
    return this.schedulesService.create(createDto);
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

  @Get('statistics')
  @ApiGetScheduleStatistics()
  getStatistics() {
    return this.schedulesService.getScheduleStatistics();
  }

  @Get('day/:dayOfWeek')
  @ApiGetSchedulesByDayOfWeek()
  findByDayOfWeek(
    @Param('dayOfWeek', new ParseEnumPipe(DayOfWeek)) dayOfWeek: DayOfWeek,
  ) {
    return this.schedulesService.findByDayOfWeek(dayOfWeek);
  }

  @Get('venue/:venue')
  @ApiGetSchedulesByVenue()
  findByVenue(@Param('venue') venue: string) {
    return this.schedulesService.findByVenue(venue);
  }

  @Get('type/:type')
  @ApiGetSchedulesByClassType()
  findByClassType(
    @Param('type', new ParseEnumPipe(ClassType)) type: ClassType,
  ) {
    return this.schedulesService.findByClassType(type);
  }
}
