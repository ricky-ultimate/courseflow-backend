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
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../generated/prisma';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get all users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':matric')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by Matric No' })
  findOne(@Param('matric') matric: string) {
    return this.usersService.findOne(matric);
  }

  @Patch(':matric')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update user' })
  update(
    @Param('matric') matric: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(matric, updateUserDto);
  }

  @Delete(':matric')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete User' })
  remove(@Param('matric') matric: string) {
    return this.usersService.remove(matric);
  }
}
