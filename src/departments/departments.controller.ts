import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
  ApiSearchDepartments,
  ApiGetDepartmentsWithCourses,
  ApiGetDepartmentsWithoutCourses,
  ApiGetDepartmentStatistics,
  ApiBulkCreateDepartments,
  ApiDownloadDepartmentTemplate,
} from './decorators/department-api.decorator';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Department, Role } from '../generated/prisma';
import { PaginationOptions } from '../common/interfaces/base-service.interface';

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
  @ApiCreateDepartment()
  create(@Body() createDto: CreateDepartmentDto) {
    return this.departmentsService.create(createDto);
  }

  @Get()
  @ApiGetDepartments()
  findAll(@Query() query?: PaginationOptions) {
    return this.departmentsService.findAll(query);
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

  @Delete(':code')
  @ApiDeleteDepartment()
  remove(@Param('code') code: string) {
    return this.departmentsService.remove(code);
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

  @Get('statistics')
  @ApiGetDepartmentStatistics()
  getStatistics() {
    return this.departmentsService.getDepartmentStatistics();
  }

  @Get('search/:searchTerm')
  @ApiSearchDepartments()
  searchByName(@Param('searchTerm') searchTerm: string) {
    return this.departmentsService.searchByName(searchTerm);
  }

  @Get('with-courses')
  @ApiGetDepartmentsWithCourses()
  findWithCourses() {
    return this.departmentsService.findWithCourses();
  }

  @Get('without-courses')
  @ApiGetDepartmentsWithoutCourses()
  findWithoutCourses() {
    return this.departmentsService.findWithoutCourses();
  }

  @Get('with-course-count')
  @ApiGetDepartmentsWithCourses() // Reusing this decorator as it's similar
  findWithCourseCount() {
    return this.departmentsService.findWithCourseCount();
  }

  @Get(':code/full-details')
  @ApiGetDepartmentByCode() // Reusing this decorator as it's similar
  findWithFullDetails(@Param('code') code: string) {
    return this.departmentsService.findWithFullDetails(code);
  }
}
