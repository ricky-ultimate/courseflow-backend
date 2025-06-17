import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Course, Role, Level } from '../generated/prisma';

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
  @ApiOperation({ summary: 'Get courses by department' })
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.coursesService.findByDepartment(departmentCode);
  }

  @Get('level/:level')
  @ApiOperation({ summary: 'Get courses by level' })
  findByLevel(@Param('level') level: Level) {
    return this.coursesService.findByLevel(level);
  }
}
