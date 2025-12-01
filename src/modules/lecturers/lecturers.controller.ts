import {
  Controller,
  Get,
  Param,
  Patch,
  Delete,
  Body,
  Query,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  ApiGetLecturers,
  ApiGetLecturerById,
  ApiCreateLecturer,
  ApiUpdateLecturer,
  ApiDeleteLecturer,
  ApiSearchLecturers,
} from './decorators/lecturer-api.decorator';
import { LecturersService } from './lecturers.service';
import { CreateLecturerDto } from './dto/create-lecturer.dto';
import { UpdateLecturerDto } from './dto/update-lecturer.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { Lecturer, Role } from '../../generated/prisma';
import { PaginationOptions } from '../../common/interfaces/base-service.interface';

@ApiTags('Lecturers')
@Controller('lecturers')
@CrudRoles({
  entity: 'lecturer',
  create: [Role.ADMIN],
  read: [Role.ADMIN, Role.LECTURER, Role.STUDENT],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class LecturersController extends BaseController<
  Lecturer,
  CreateLecturerDto,
  UpdateLecturerDto
> {
  constructor(private readonly lecturersService: LecturersService) {
    super(lecturersService);
  }

  @Post()
  @ApiCreateLecturer()
  create(@Body() createDto: CreateLecturerDto) {
    return this.lecturersService.create(createDto);
  }

  @Get()
  @ApiGetLecturers()
  findAll(@Query() query?: PaginationOptions) {
    return this.lecturersService.findAll(query);
  }

  @Get(':id')
  @ApiGetLecturerById()
  findOne(@Param('id') id: string) {
    return this.lecturersService.findOne(id);
  }

  @Patch(':id')
  @ApiUpdateLecturer()
  update(@Param('id') id: string, @Body() updateDto: UpdateLecturerDto) {
    return this.lecturersService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiDeleteLecturer()
  remove(@Param('id') id: string) {
    return this.lecturersService.remove(id);
  }

  @Get('department/:departmentCode')
  @ApiGetLecturers()
  findByDepartment(@Param('departmentCode') departmentCode: string) {
    return this.lecturersService.findByDepartment(departmentCode);
  }

  @Get('search/:searchTerm')
  @ApiSearchLecturers()
  searchByName(@Param('searchTerm') searchTerm: string) {
    return this.lecturersService.searchByName(searchTerm);
  }
}
