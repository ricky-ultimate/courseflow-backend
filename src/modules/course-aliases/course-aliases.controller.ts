import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CourseAliasesService } from './course-aliases.service';
import { CreateCourseAliasDto } from './dto/create-course-alias.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';
import { Role } from '../../generated/prisma';

@ApiTags('Course Aliases')
@ApiBearerAuth('JWT-auth')
@Controller('course-aliases')
export class CourseAliasesController {
  constructor(private readonly courseAliasesService: CourseAliasesService) {}

  @Post()
  @Roles(Role.ADMIN, Role.HOD)
  @SkipHodGuard()
  @ApiOperation({ summary: 'Link two courses as aliases of each other' })
  create(@Body() dto: CreateCourseAliasDto) {
    return this.courseAliasesService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all course alias relationships' })
  findAll() {
    return this.courseAliasesService.findAll();
  }

  @Get('course/:code')
  @ApiOperation({ summary: 'Get all aliases for a specific course' })
  @ApiParam({ name: 'code', type: 'string' })
  findForCourse(@Param('code') code: string) {
    return this.courseAliasesService.findForCourse(code);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.HOD)
  @SkipHodGuard()
  @ApiOperation({ summary: 'Remove a course alias relationship' })
  @ApiParam({ name: 'id', type: 'string' })
  remove(@Param('id') id: string) {
    return this.courseAliasesService.remove(id);
  }
}
