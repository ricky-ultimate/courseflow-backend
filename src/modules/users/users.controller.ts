import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Param,
  Patch,
  Delete,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserFilterDto } from './dto/user-filter.dto';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../generated/prisma';
import { AuthenticatedRequest } from '../../common/types/auth.types';
import { SkipCollegeGuard } from '../../common/decorators/skip-college-guard.decorator';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@SkipCollegeGuard()
@SkipHodGuard()
@CrudRoles({
  create: [Role.ADMIN, Role.COLLEGE_ADMIN],
  read: [Role.ADMIN, Role.COLLEGE_ADMIN],
  update: [Role.ADMIN, Role.COLLEGE_ADMIN],
  delete: [Role.ADMIN],
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin / College Admin)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get users with optional role/department filter',
    description:
      'Admins see all users. College Admins see only lecturers and HODs within their college.',
  })
  async findAll(
    @Query() query: UserFilterDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.usersService.findAllWithoutPasswords(query, req.user);
  }

  @Get('me/dashboard')
  @Roles(Role.LECTURER, Role.HOD)
  @ApiOperation({
    summary: 'Get dashboard stats for authenticated lecturer/HOD',
  })
  async getDashboardStats(@Req() req: AuthenticatedRequest) {
    return this.usersService.getDashboardStats(req.user.id);
  }

  @Get('me/courses')
  @Roles(Role.LECTURER, Role.HOD)
  @ApiOperation({ summary: 'Get courses taught by authenticated lecturer/HOD' })
  async getMyCourses(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMyCourses(req.user.id);
  }

  @Get('me/schedule')
  @Roles(Role.LECTURER, Role.HOD)
  @ApiOperation({ summary: 'Get timetable for authenticated lecturer/HOD' })
  async getMySchedule(@Req() req: AuthenticatedRequest) {
    return this.usersService.getMySchedule(req.user.id);
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findOneWithoutPassword(id);
  }

  @Patch(':id')
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Update user by ID' })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Delete user by ID (Admin only)' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
