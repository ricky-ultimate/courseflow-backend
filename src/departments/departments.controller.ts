import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  create: [Role.ADMIN, Role.LECTURER],
  read: [],
  update: [Role.ADMIN, Role.LECTURER],
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
}
