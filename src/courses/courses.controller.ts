import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma';

@ApiTags('Courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LECTURER)
  @ApiOperation({ summary: 'Create a new course' })
  create(@Body() dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get('department/:departmentCode')
  @ApiOperation({ summary: 'Get courses by department' })
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.coursesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @ApiOperation({ summary: 'Get courses by level' })
  findByLevel(@Param('level') level: string) {
    return this.coursesService.findByLevel(level);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get course by code' })
  findOne(@Param('code') code: string) {
    return this.coursesService.findOne(code);
  }

  @Patch(':code')
  @Roles(Role.ADMIN, Role.LECTURER)
  @ApiOperation({ summary: 'Update course' })
  update(@Param('code') code: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.update(code, dto);
  }

  @Delete(':code')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete course' })
  remove(@Param('code') code: string) {
    return this.coursesService.remove(code);
  }
}
