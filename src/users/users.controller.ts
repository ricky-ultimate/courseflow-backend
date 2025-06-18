import {
  Body,
  Controller,
  Post,
  Get,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Role } from '../generated/prisma';
import { PaginationOptions } from '../common/interfaces/base-service.interface';

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
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
  })
  @ApiBody({ type: CreateUserDto })
  async create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: PaginationOptions) {
    return this.usersService.findAllWithoutPasswords(query);
  }

  @Get(':matricNO')
  @ApiOperation({ summary: 'Get user by matric number' })
  async findOne(@Param('matricNO') matricNO: string) {
    return this.usersService.findOneWithoutPassword(matricNO);
  }

  @Patch(':matricNO')
  @ApiOperation({ summary: 'Update user' })
  async update(
    @Param('matricNO') matricNO: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(matricNO, dto);
  }

  @Delete(':matricNO')
  @ApiOperation({ summary: 'Delete user' })
  async remove(@Param('matricNO') matricNO: string) {
    return this.usersService.remove(matricNO);
  }
}
