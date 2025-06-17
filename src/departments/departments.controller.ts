import { Body, Controller, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Department, Role } from '../generated/prisma';

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

  @Get(':code')
  @ApiOperation({ summary: 'Get department by code' })
  @ApiParam({ name: 'code', description: 'Department code' })
  findOne(@Param('code') code: string) {
    return this.departmentsService.findOne(code);
  }

  @Patch(':code')
  @ApiOperation({ summary: 'Update department by code' })
  @ApiParam({ name: 'code', description: 'Department code' })
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
