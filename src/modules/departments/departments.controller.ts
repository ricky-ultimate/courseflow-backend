import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetDepartments,
  ApiGetDepartmentByCode,
  ApiCreateDepartment,
  ApiUpdateDepartment,
  ApiDeleteDepartment,
  ApiGetDepartmentStatistics,
  ApiBulkCreateDepartments,
  ApiDownloadDepartmentTemplate,
  ApiLockDepartmentSchedule,
  ApiUnlockDepartmentSchedule,
} from './decorators/department-api.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { DepartmentFilterDto } from './dto/department-filter.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';
import { Department, Role } from '../../generated/prisma';
import { AuthenticatedRequest } from '../../common/types/auth.types';

@ApiTags('Departments')
@Controller('departments')
@CrudRoles({
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
  @ApiCreateDepartment()
  create(@Body() createDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDto);
  }

  @Get()
  @ApiGetDepartments()
  findAll(@Query() query?: DepartmentFilterDto) {
    return this.departmentsService.findAll(query);
  }

  @Get('statistics')
  @ApiGetDepartmentStatistics()
  getStatistics() {
    return this.departmentsService.getDepartmentStatistics();
  }

  @Get('bulk/template')
  @ApiDownloadDepartmentTemplate()
  downloadCsvTemplate(@Res() res: Response) {
    const template = this.departmentsService.generateCsvTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=departments-template.csv',
    );
    res.send(template);
  }

  @Post('bulk/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiBulkCreateDepartments()
  async bulkCreateFromCsv(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new Error('File must be a CSV');
    }

    return this.departmentsService.bulkCreateFromCsv(file.buffer);
  }

  @Get(':code')
  @ApiGetDepartmentByCode()
  findOne(@Param('code') code: string) {
    return this.departmentsService.findOne(code);
  }

  @Get(':code/full-details')
  @ApiGetDepartmentByCode()
  findWithFullDetails(@Param('code') code: string) {
    return this.departmentsService.findWithFullDetails(code);
  }

  @Patch(':code')
  @ApiUpdateDepartment()
  update(@Param('code') code: string, @Body() updateDto: UpdateDepartmentDto) {
    return this.departmentsService.update(code, updateDto);
  }

  @Patch(':code/schedule/lock')
  @Roles(Role.HOD, Role.ADMIN)
  @SkipHodGuard()
  @ApiLockDepartmentSchedule()
  lockSchedule(
    @Param('code') code: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.departmentsService.lockSchedule(code, req.user);
  }

  @Patch(':code/schedule/unlock')
  @Roles(Role.HOD, Role.ADMIN)
  @SkipHodGuard()
  @ApiUnlockDepartmentSchedule()
  unlockSchedule(
    @Param('code') code: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.departmentsService.unlockSchedule(code, req.user);
  }

  @Delete(':code')
  @ApiDeleteDepartment()
  remove(@Param('code') code: string) {
    return this.departmentsService.remove(code);
  }
}
