import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseController } from '../common/controllers/base.controller';
import { Department, Role } from '../generated/prisma';

@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController extends BaseController<
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto
> {
  constructor(private readonly departmentsService: DepartmentsService) {
    super(departmentsService, {
      entity: 'department',
      createRoles: [Role.ADMIN, Role.LECTURER],
      updateRoles: [Role.ADMIN, Role.LECTURER],
      deleteRoles: [Role.ADMIN],
    });
  }
}
