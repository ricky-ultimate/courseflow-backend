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
  ApiQuery,
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

@ApiTags('Users')
@ApiBearerAuth('JWT-auth')
@Controller('users')
@CrudRoles({
  entity: 'user',
  create: [Role.ADMIN],
  read: [Role.ADMIN],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all users with optional role/department filter',
    description:
      'Use ?role=LECTURER to get lecturers, ?role=STUDENT for students, etc.',
  })
  async findAll(@Query() query: UserFilterDto) {
    return this.usersService.findAllWithoutPasswords(query);
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
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiOperation({ summary: 'Delete user by ID' })
  async remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
