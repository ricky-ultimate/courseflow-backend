import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseService } from '../common/services/base.service';
import { Department } from '../generated/prisma';

@Injectable()
export class DepartmentsService extends BaseService<
  Department,
  CreateDepartmentDto,
  UpdateDepartmentDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'department',
      identifierField: 'code',
      uniqueFields: ['code', 'name'],
      softDelete: true,
      defaultOrderBy: { name: 'asc' },
    });
  }
}
