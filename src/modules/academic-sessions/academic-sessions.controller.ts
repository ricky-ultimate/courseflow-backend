import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { AcademicSession, Role } from '../../generated/prisma';
import { PaginationOptions } from '../../common/interfaces/base-service.interface';
import {
  ApiActivateSession,
  ApiArchiveSession,
  ApiCreateAcademicSession,
  ApiDeleteAcademicSession,
  ApiGetAcademicSessionById,
  ApiGetAcademicSessions,
  ApiGetActiveSession,
  ApiGetSessionStatistics,
  ApiUpdateAcademicSession,
} from './decorators/academic-session-api.decorator';

@ApiTags('Academic Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('academic-sessions')
@CrudRoles({
  create: [Role.ADMIN],
  read: [],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class AcademicSessionsController extends BaseController<
  AcademicSession,
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto
> {
  constructor(
    private readonly academicSessionsService: AcademicSessionsService,
  ) {
    super(academicSessionsService);
  }

  @Post()
  @ApiCreateAcademicSession()
  create(@Body() createDto: CreateAcademicSessionDto) {
    return this.academicSessionsService.create(createDto);
  }

  @Get()
  @ApiGetAcademicSessions()
  findAll(@Query() query?: PaginationOptions) {
    return this.academicSessionsService.findAll(query);
  }

  @Get('active')
  @ApiGetActiveSession()
  getActiveSession() {
    return this.academicSessionsService.getActiveSession();
  }

  @Get(':id')
  @ApiGetAcademicSessionById()
  findOne(@Param('id') id: string) {
    return this.academicSessionsService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiGetSessionStatistics()
  getStatistics(@Param('id') id: string) {
    return this.academicSessionsService.getSessionStatistics(id);
  }

  @Patch(':id')
  @ApiUpdateAcademicSession()
  update(@Param('id') id: string, @Body() updateDto: UpdateAcademicSessionDto) {
    return this.academicSessionsService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @ApiActivateSession()
  setActive(@Param('id') id: string) {
    return this.academicSessionsService.setActiveSession(id);
  }

  @Patch(':id/archive')
  @ApiArchiveSession()
  archive(@Param('id') id: string) {
    return this.academicSessionsService.archiveSession(id);
  }

  @Delete(':id')
  @ApiDeleteAcademicSession()
  remove(@Param('id') id: string) {
    return this.academicSessionsService.remove(id);
  }
}
