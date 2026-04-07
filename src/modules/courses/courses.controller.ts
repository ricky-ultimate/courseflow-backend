import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  Post,
  UploadedFile,
  UseInterceptors,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetCourses,
  ApiGetCourseByCode,
  ApiCreateCourse,
  ApiUpdateCourse,
  ApiDeleteCourse,
  ApiGetCoursesWithoutSchedules,
  ApiGetCourseStatistics,
  ApiBulkCreateCourses,
  ApiDownloadCourseTemplate,
} from './decorators/course-api.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Course, Role } from '../../generated/prisma';

@ApiTags('Courses')
@Controller('courses')
@CrudRoles({
  create: [Role.ADMIN, Role.HOD],
  read: [],
  update: [Role.ADMIN, Role.HOD],
  delete: [Role.ADMIN],
})
export class CoursesController extends BaseController<
  Course,
  CreateCourseDto,
  UpdateCourseDto
> {
  constructor(private readonly coursesService: CoursesService) {
    super(coursesService);
  }

  @Get()
  @ApiGetCourses()
  findAll(@Query() query?: CourseFilterDto) {
    return this.coursesService.findAll(query);
  }

  @Get('without-schedules')
  @ApiGetCoursesWithoutSchedules()
  findWithoutSchedules() {
    return this.coursesService.findWithoutSchedules();
  }

  @Get('statistics')
  @ApiGetCourseStatistics()
  getStatistics() {
    return this.coursesService.getCourseStats();
  }

  @Get('bulk/template')
  @ApiDownloadCourseTemplate()
  downloadCsvTemplate(@Res() res: ExpressResponse): void {
    const template = this.coursesService.generateCsvTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=courses-template.csv',
    );
    res.send(template);
  }

  @Post('bulk/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBulkCreateCourses()
  async bulkCreateFromCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    return this.coursesService.bulkCreateFromCsv(file.buffer);
  }

  @Get(':code')
  @ApiGetCourseByCode()
  findOne(@Param('code') code: string) {
    return this.coursesService.findOne(code);
  }

  @Post()
  @ApiCreateCourse()
  create(@Body() createDto: CreateCourseDto) {
    return this.coursesService.create(createDto);
  }

  @Patch(':code')
  @ApiUpdateCourse()
  update(@Param('code') code: string, @Body() updateDto: UpdateCourseDto) {
    return this.coursesService.update(code, updateDto);
  }

  @Delete(':code')
  @ApiDeleteCourse()
  remove(@Param('code') code: string) {
    return this.coursesService.remove(code);
  }
}
