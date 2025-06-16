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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { Role } from '../generated/prisma';

@ApiTags('Departments')
@ApiBearerAuth()
@Controller('departments')
@UseGuards(RolesGuard)
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) {}

  @Post()
  @Roles(Role.ADMIN, Role.LECTURER)
  @ApiOperation({ summary: 'Create a new department' })
  create(@Body() dto: CreateDepartmentDto) {
    return this.departmentsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  findAll() {
    return this.departmentsService.findAll();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get department by code' })
  findOne(@Param('code') code: string) {
    return this.departmentsService.findOne(code);
  }

  @Patch(':code')
  @Roles(Role.ADMIN, Role.LECTURER)
  @ApiOperation({ summary: 'Update department' })
  update(@Param('code') code: string, @Body() dto: UpdateDepartmentDto) {
    return this.departmentsService.update(code, dto);
  }

  @Delete(':code')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete department' })
  remove(@Param('code') code: string) {
    return this.departmentsService.remove(code);
  }
}
