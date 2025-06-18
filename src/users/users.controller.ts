import { Body, Controller, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Role, User } from '../generated/prisma';

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
export class UsersController extends BaseController<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(private readonly usersService: UsersService) {
    super(usersService);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiBody({ type: CreateUserDto })
  create(@Body() createDto: CreateUserDto) {
    return this.usersService.create(createDto);
  }
}
