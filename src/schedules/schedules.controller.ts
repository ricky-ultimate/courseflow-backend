import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma';

@ApiTags('Schedules')
@ApiBearerAuth()
@Controller('schedules')
@UseGuards(RolesGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LECTURER)
  @ApiOperation({ summary: 'Create a new schedule' })
  create(@Body() dto: CreateScheduleDto) {
    return this.schedulesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all schedules' })
  findAll() {
    return this.schedulesService.findAll();
  }

  @Get('course/:courseCode')
  @ApiOperation({ summary: 'Get schedules by course' })
  findByCourse(@Param('courseCode') courseCode: string) {
    return this.schedulesService.findByCourse(courseCode);
  }

  @Get('department/:departmentId')
  @ApiOperation({ summary: 'Get schedules by department' })
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.schedulesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @ApiOperation({ summary: 'Get schedules by level' })
  findByLevel(@Param('level') level: string) {
    return this.schedulesService.findByLevel(level);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by ID' })
  findOne(@Param('id') id: string) {
    return this.schedulesService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.LECTURER)
  @ApiOperation({ summary: 'Update schedule' })
  update(@Param('id') id: string, @Body() dto: UpdateScheduleDto) {
    return this.schedulesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete schedule' })
  remove(@Param('id') id: string) {
    return this.schedulesService.remove(id);
  }
}
