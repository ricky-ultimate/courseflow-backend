import { Controller, Delete, Post, Body, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';
import { SkipCollegeGuard } from '../../common/decorators/skip-college-guard.decorator';
import { Role } from '../../generated/prisma';
import { AuthenticatedRequest } from '../../common/types/auth.types';

@ApiTags('Admin')
@ApiBearerAuth('JWT-auth')
@Controller('admin')
@SkipHodGuard()
@SkipCollegeGuard()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('schedules')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Delete all schedules (Admin / College Admin)' })
  deleteAllSchedules(@Req() req: AuthenticatedRequest) {
    return this.adminService.deleteAllSchedules(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Delete('exam-schedules')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({
    summary: 'Delete all exam schedules (Admin / College Admin)',
  })
  deleteAllExamSchedules(@Req() req: AuthenticatedRequest) {
    return this.adminService.deleteAllExamSchedules(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Delete('courses')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Delete all courses (Admin / College Admin)' })
  deleteAllCourses(@Req() req: AuthenticatedRequest) {
    return this.adminService.deleteAllCourses(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Delete('departments')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Delete all departments (Admin / College Admin)' })
  deleteAllDepartments(@Req() req: AuthenticatedRequest) {
    return this.adminService.deleteAllDepartments(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Delete('all')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete all data (Super Admin only)' })
  deleteAllData() {
    return this.adminService.deleteAllData();
  }

  @Delete('schedules-except-general')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({
    summary:
      'Delete all schedules except general courses (Admin / College Admin)',
  })
  deleteAllSchedulesExceptGeneral(@Req() req: AuthenticatedRequest) {
    return this.adminService.deleteAllSchedulesExceptGeneral(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Post('seed/departments')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Seed departments (Admin / College Admin)' })
  seedDepartments(@Req() req: AuthenticatedRequest) {
    return this.adminService.seedDepartments(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Post('seed/courses')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Seed courses (Admin / College Admin)' })
  seedCourses(@Req() req: AuthenticatedRequest) {
    return this.adminService.seedCourses(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Post('seed/all')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Seed all data (Admin / College Admin)' })
  seedAll(@Req() req: AuthenticatedRequest) {
    return this.adminService.seedAll(
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }
}
