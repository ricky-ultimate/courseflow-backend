import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Department, Role } from '../generated/prisma';
import { Public } from '../common/decorators/public.decorator';

@ApiTags('Departments')
@Controller('departments')
@CrudRoles({
  entity: 'department',
  create: [Role.ADMIN],
  read: [],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class DepartmentsController extends BaseController<
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto
> {
  constructor(private readonly departmentsService: DepartmentsService) {
    super(departmentsService);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new department' })
  @ApiBody({ type: CreateDepartmentDto })
  create(@Body() createDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all departments' })
  findAll(@Query() query?: any) {
    return this.departmentsService.findAll(query);
  }

  @Get(':code')
  @Public()
  @ApiOperation({ summary: 'Get department by code' })
  @ApiParam({ name: 'code', description: 'Department code' })
  findOne(@Param('code') code: string) {
    return this.departmentsService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update department by code' })
  @ApiParam({ name: 'code', description: 'Department code' })
  @ApiBody({ type: UpdateDepartmentDto })
  update(@Param('code') code: string, @Body() updateDto: UpdateDepartmentDto) {
    return this.departmentsService.update(code, updateDto);
  }

  @Delete(':code')
  @ApiOperation({ summary: 'Delete department by code' })
  @ApiParam({ name: 'code', description: 'Department code' })
  remove(@Param('code') code: string) {
    return this.departmentsService.remove(code);
  }
}
