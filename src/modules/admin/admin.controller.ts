import { Controller, Delete, Post, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';
import { Role } from '../../generated/prisma';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@Roles(Role.ADMIN)
@SkipHodGuard()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('schedules')
  @ApiOperation({ summary: 'Delete all schedules' })
  deleteAllSchedules() {
    return this.adminService.deleteAllSchedules();
  }

  @Delete('exam-schedules')
  @ApiOperation({ summary: 'Delete all exam schedules' })
  deleteAllExamSchedules() {
    return this.adminService.deleteAllExamSchedules();
  }

  @Delete('courses')
  @ApiOperation({ summary: 'Delete all courses' })
  deleteAllCourses() {
    return this.adminService.deleteAllCourses();
  }

  @Delete('departments')
  @ApiOperation({ summary: 'Delete all departments' })
  deleteAllDepartments() {
    return this.adminService.deleteAllDepartments();
  }

  @Delete('all')
  @ApiOperation({ summary: 'Delete all data' })
  deleteAllData() {
    return this.adminService.deleteAllData();
  }

  @Post('seed/departments')
  @ApiOperation({ summary: 'Seed departments' })
  seedDepartments() {
    return this.adminService.seedDepartments();
  }

  @Post('seed/courses')
  @ApiOperation({ summary: 'Seed courses' })
  seedCourses() {
    return this.adminService.seedCourses();
  }

  @Post('seed/all')
  @ApiOperation({ summary: 'Seed all data' })
  seedAll() {
    return this.adminService.seedAll();
  }
}
