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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiQuery,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Department, Role } from '../generated/prisma';
import { PaginationOptions } from '../common/interfaces/base-service.interface';

@ApiTags('Departments')
@ApiBearerAuth('JWT-auth')
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
  @ApiOperation({ summary: 'Get all departments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  findAll(@Query() query?: PaginationOptions) {
    return this.departmentsService.findAll(query);
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

  @Post('bulk/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Bulk create departments from CSV',
    description:
      'Upload a CSV file to create multiple departments at once. CSV must have columns: code, name',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file with departments data',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Bulk operation completed',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        created: { type: 'array', items: { type: 'object' } },
        errors: { type: 'array', items: { type: 'object' } },
        summary: {
          type: 'object',
          properties: {
            totalRows: { type: 'number' },
            successCount: { type: 'number' },
            errorCount: { type: 'number' },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: 'Download CSV template for bulk department creation',
    description:
      'Download a CSV template file with the required headers and sample data',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV template file',
    headers: {
      'Content-Type': { description: 'text/csv' },
      'Content-Disposition': {
        description: 'attachment; filename=departments-template.csv',
      },
    },
  })
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
  @ApiOperation({
    summary: 'Get department statistics',
    description:
      'Get comprehensive statistics about departments including course counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Department statistics',
    schema: {
      type: 'object',
      properties: {
        totalDepartments: { type: 'number' },
        departmentsWithCourses: { type: 'number' },
        departmentsWithoutCourses: { type: 'number' },
        averageCoursesPerDepartment: { type: 'number' },
      },
    },
  })
  getStatistics() {
    return this.departmentsService.getDepartmentStatistics();
  }

  @Get('search/:searchTerm')
  @ApiOperation({ summary: 'Search departments by name' })
  @ApiParam({
    name: 'searchTerm',
    description: 'Search term for department name',
    example: 'computer',
  })
  searchByName(@Param('searchTerm') searchTerm: string) {
    return this.departmentsService.searchByName(searchTerm);
  }

  @Get('with-courses')
  @ApiOperation({ summary: 'Get departments with their courses' })
  findWithCourses() {
    return this.departmentsService.findWithCourses();
  }

  @Get('without-courses')
  @ApiOperation({ summary: 'Get departments without courses' })
  findWithoutCourses() {
    return this.departmentsService.findWithoutCourses();
  }

  @Get('with-course-count')
  @ApiOperation({ summary: 'Get departments with course counts' })
  findWithCourseCount() {
    return this.departmentsService.findWithCourseCount();
  }

  @Get(':code/full-details')
  @ApiOperation({
    summary: 'Get department with full details including courses and schedules',
  })
  @ApiParam({
    name: 'code',
    description: 'Department code',
    example: 'CS',
  })
  findWithFullDetails(@Param('code') code: string) {
    return this.departmentsService.findWithFullDetails(code);
  }
}
