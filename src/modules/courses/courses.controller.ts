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
  UploadedFiles,
  UseInterceptors,
  Res,
  BadRequestException,
  Req,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Response as ExpressResponse } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  ApiGetCourses,
  ApiGetCourseByCode,
  ApiCreateCourse,
  ApiUpdateCourse,
  ApiDeleteCourse,
  ApiGetCoursesWithoutSchedules,
  ApiGetUniversityCoursesWithoutSchedules,
  ApiGetCourseStatistics,
  ApiBulkCreateCourses,
  ApiBulkCreateCoursesMultiple,
  ApiDownloadCourseTemplate,
} from './decorators/course-api.decorator';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Course, Role } from '../../generated/prisma';
import { AuthenticatedRequest } from '../../common/types/auth.types';

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
@Controller('courses')
@CrudRoles({
  create: [Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN],
  read: [],
  update: [Role.ADMIN, Role.HOD, Role.COLLEGE_ADMIN],
  delete: [Role.ADMIN, Role.COLLEGE_ADMIN],
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

  @Get('without-schedules/university')
  @ApiGetUniversityCoursesWithoutSchedules()
  findUniversityCoursesWithoutSchedules() {
    return this.coursesService.findUniversityCoursesWithoutSchedules();
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
  async bulkCreateFromCsv(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }

    return this.coursesService.bulkCreateFromCsv(
      file.buffer,
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Post('bulk/upload-multi')
  @UseInterceptors(FilesInterceptor('files', 20))
  @ApiBulkCreateCoursesMultiple()
  async bulkCreateFromMultipleCsv(
    @UploadedFiles() files: Express.Multer.File[],
    @Req() req: AuthenticatedRequest,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    const invalidFiles = files.filter(
      (file) =>
        file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv'),
    );

    if (invalidFiles.length > 0) {
      throw new BadRequestException(
        `The following files must be CSV: ${invalidFiles
          .map((file) => file.originalname)
          .join(', ')}`,
      );
    }

    const fileNames = files.map((file) => file.originalname);
    const duplicateNames = [
      ...new Set(
        fileNames.filter((name, index) => fileNames.indexOf(name) !== index),
      ),
    ];

    if (duplicateNames.length > 0) {
      throw new BadRequestException(
        `Duplicate file names detected: ${duplicateNames.join(', ')}. Rename files before uploading.`,
      );
    }

    return this.coursesService.bulkCreateFromMultipleCsv(
      files.map((file) => ({
        originalName: file.originalname,
        buffer: file.buffer,
      })),
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
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
