import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  ParseEnumPipe,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiConsumes,
  ApiResponse,
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

  @Post('bulk/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Bulk create schedules from CSV',
    description:
      'Upload a CSV file to create multiple schedules at once. CSV must have columns: courseCode, dayOfWeek, startTime, endTime, venue, type (optional)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with schedules data',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk operation completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        created: { type: 'array', items: { type: 'object' } },
        errors: { type: 'array', items: { type: 'object' } },
        summary: {
          type: 'object',
          properties: {
            totalRows: { type: 'number' },
            successCount: { type: 'number' },
            errorCount: { type: 'number' },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Download CSV template for bulk schedule creation',
    description:
      'Download a CSV template file with the required headers and sample data',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV template file',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': {
        description: 'attachment; filename=schedules-template.csv',
      },
    },
  })
  downloadCsvTemplate(@Res() res: Response) {
    const template = this.schedulesService.generateCsvTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=schedules-template.csv',
    );
    res.send(template);
  }
}
