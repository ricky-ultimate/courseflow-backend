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
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Course, Role, Level } from '../generated/prisma';

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
  findAll(@Query() query?: any) {
    return this.coursesService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new course' })
  @ApiBody({ type: CreateCourseDto })
  create(@Body() createDto: CreateCourseDto) {
    return this.coursesService.create(createDto);
  }
}
