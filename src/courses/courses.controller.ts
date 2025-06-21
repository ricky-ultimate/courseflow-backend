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
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Course, Role, Level } from '../generated/prisma';
import { PaginationOptions } from '../common/interfaces/base-service.interface';

@ApiTags('Courses')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get courses by department' })
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.coursesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @ApiOperation({ summary: 'Get courses by level' })
  @ApiParam({
    name: 'level',
    enum: Level,
    description: 'Academic level',
    example: 'LEVEL_100',
  })
  findByLevel(@Param('level', new ParseEnumPipe(Level)) level: Level) {
    return this.coursesService.findByLevel(level);
  }
  @Get(':code')
  @ApiOperation({ summary: 'Get course by code' })
  @ApiParam({ name: 'code', description: 'Course code' })
  findOne(@Param('code') code: string) {
    return this.coursesService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update course by code' })
  @ApiParam({ name: 'code', description: 'Course code' })
  update(@Param('code') code: string, @Body() updateDto: UpdateCourseDto) {
    return this.coursesService.update(code, updateDto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete course by code' })
  @ApiParam({ name: 'code', description: 'Course code' })
  remove(@Param('code') code: string) {
    return this.coursesService.remove(code);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  findAll(@Query() query?: PaginationOptions) {
    return this.coursesService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  create(@Body() createDto: CreateCourseDto) {
    return this.coursesService.create(createDto);
  }

  @Post('bulk/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Bulk create courses from CSV',
    description:
      'Upload a CSV file to create multiple courses at once. CSV must have columns: code, name, level, credits, departmentCode',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with courses data',
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

    return this.coursesService.bulkCreateFromCsv(file.buffer);
  }

  @Get('bulk/template')
  @ApiOperation({
    summary: 'Download CSV template for bulk course creation',
    description:
      'Download a CSV template file with the required headers and sample data',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV template file',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': {
        description: 'attachment; filename=courses-template.csv',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get course statistics',
    description:
      'Get comprehensive statistics about courses including counts by level and department',
  })
  @ApiResponse({
    status: 200,
    description: 'Course statistics',
    schema: {
      type: 'object',
      properties: {
        totalCourses: { type: 'number' },
        coursesByLevel: { type: 'object' },
        coursesByDepartment: { type: 'object' },
        averageCredits: { type: 'number' },
      },
    },
  })
  getStatistics() {
    return this.coursesService.getCourseStatistics();
  }

  @Get('search/:searchTerm')
  @ApiOperation({ summary: 'Search courses by name' })
  @ApiParam({
    name: 'searchTerm',
    description: 'Search term for course name',
    example: 'programming',
  })
  searchByName(@Param('searchTerm') searchTerm: string) {
    return this.coursesService.searchByName(searchTerm);
  }

  @Get('credits/:minCredits/:maxCredits')
  @ApiOperation({ summary: 'Find courses by credit range' })
  @ApiParam({
    name: 'minCredits',
    description: 'Minimum credits',
    example: '3',
  })
  @ApiParam({
    name: 'maxCredits',
    description: 'Maximum credits',
    example: '6',
  })
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
  @ApiOperation({ summary: 'Get courses without schedules' })
  findWithoutSchedules() {
    return this.coursesService.findWithoutSchedules();
  }
}
