import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  Post,
  ParseEnumPipe,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetCourses,
  ApiGetCourseByCode,
  ApiCreateCourse,
  ApiUpdateCourse,
  ApiDeleteCourse,
  ApiGetCoursesByDepartment,
  ApiGetCoursesByLevel,
  ApiSearchCourses,
  ApiGetCoursesWithoutSchedules,
  ApiGetCourseStatistics,
  ApiBulkCreateCourses,
  ApiDownloadCourseTemplate,
} from './decorators/course-api.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Course, Role, Level } from '../generated/prisma';
import { PaginationOptions } from '../common/interfaces/base-service.interface';

@ApiTags('Courses')
@Controller('courses')
@CrudRoles({
  entity: 'course',
  create: [Role.ADMIN, Role.LECTURER],
  read: [],
  update: [Role.ADMIN, Role.LECTURER],
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

  @Get('department/:departmentCode')
  @ApiGetCoursesByDepartment()
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.coursesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @ApiGetCoursesByLevel()
  findByLevel(@Param('level', new ParseEnumPipe(Level)) level: Level) {
    return this.coursesService.findByLevel(level);
  }
  @Get(':code')
  @ApiGetCourseByCode()
  findOne(@Param('code') code: string) {
    return this.coursesService.findOne(code);
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

  @Get()
  @ApiGetCourses()
  findAll(@Query() query?: PaginationOptions) {
    return this.coursesService.findAll(query);
  }

  @Post()
  @ApiCreateCourse()
  create(@Body() createDto: CreateCourseDto) {
    return this.coursesService.create(createDto);
  }

  @Post('bulk/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBulkCreateCourses()
  async bulkCreateFromCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new Error('File must be a CSV');
    }

    return this.coursesService.bulkCreateFromCsv(file.buffer);
  }

  @Get('bulk/template')
  @ApiDownloadCourseTemplate()
  downloadCsvTemplate(@Res() res: Response) {
    const template = this.coursesService.generateCsvTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=courses-template.csv',
    );
    res.send(template);
  }

  @Get('statistics')
  @ApiGetCourseStatistics()
  getStatistics() {
    return this.coursesService.getCourseStatistics();
  }

  @Get('search/:searchTerm')
  @ApiSearchCourses()
  searchByName(@Param('searchTerm') searchTerm: string) {
    return this.coursesService.searchByName(searchTerm);
  }

  @Get('credits/:minCredits/:maxCredits')
  @ApiSearchCourses() // We can reuse this or create a specific one
  findByCreditRange(
    @Param('minCredits') minCredits: string,
    @Param('maxCredits') maxCredits: string,
  ) {
    return this.coursesService.findByCreditRange(
      parseInt(minCredits),
      parseInt(maxCredits),
    );
  }

  @Get('without-schedules')
  @ApiGetCoursesWithoutSchedules()
  findWithoutSchedules() {
    return this.coursesService.findWithoutSchedules();
  }
}
