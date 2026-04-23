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
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetDepartments,
  ApiGetDepartmentByCode,
  ApiGetDepartmentWithFullDetails,
  ApiGetDepartmentProgrammes,
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
  create: [Role.ADMIN, Role.COLLEGE_ADMIN],
  read: [],
  update: [Role.ADMIN, Role.COLLEGE_ADMIN],
  delete: [Role.ADMIN, Role.COLLEGE_ADMIN],
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
  async bulkCreateFromCsv(
    @UploadedFile() file: Express.Multer.File,
    @Req() req: AuthenticatedRequest,
  ) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (file.mimetype !== 'text/csv' && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV');
    }
    return this.departmentsService.bulkCreateFromCsv(
      file.buffer,
      req.user.role === Role.COLLEGE_ADMIN ? req.user.collegeCode : undefined,
    );
  }

  @Get(':code/programmes')
  @ApiGetDepartmentProgrammes()
  getProgrammes(@Param('code') code: string) {
    return this.departmentsService.getProgrammes(code);
  }

  @Get(':code/full-details')
  @ApiGetDepartmentWithFullDetails()
  findWithFullDetails(@Param('code') code: string) {
    return this.departmentsService.findWithFullDetails(code);
  }

  @Get(':code')
  @ApiGetDepartmentByCode()
  findOne(@Param('code') code: string) {
    return this.departmentsService.findOne(code);
  }

  @Patch(':code')
  @ApiUpdateDepartment()
  update(@Param('code') code: string, @Body() updateDto: UpdateDepartmentDto) {
    return this.departmentsService.update(code, updateDto);
  }

  @Patch(':code/schedule/lock')
  @Roles(Role.HOD, Role.ADMIN, Role.COLLEGE_ADMIN)
  @SkipHodGuard()
  @ApiLockDepartmentSchedule()
  lockSchedule(@Param('code') code: string, @Req() req: AuthenticatedRequest) {
    return this.departmentsService.lockSchedule(code, req.user);
  }

  @Patch(':code/schedule/unlock')
  @Roles(Role.HOD, Role.ADMIN, Role.COLLEGE_ADMIN)
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
