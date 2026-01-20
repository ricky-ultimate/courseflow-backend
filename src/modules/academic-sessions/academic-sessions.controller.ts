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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AcademicSessionsService } from './academic-sessions.service';
import { CreateAcademicSessionDto } from './dto/create-academic-session.dto';
import { UpdateAcademicSessionDto } from './dto/update-academic-session.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { AcademicSession, Role } from '../../generated/prisma';
import { PaginationOptions } from '../../common/interfaces/base-service.interface';

@ApiTags('Academic Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('academic-sessions')
@CrudRoles({
  entity: 'academic-session',
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
  constructor(private readonly academicSessionsService: AcademicSessionsService) {
    super(academicSessionsService);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new academic session' })
  @ApiResponse({ status: 201, description: 'Academic session created successfully' })
  create(@Body() createDto: CreateAcademicSessionDto) {
    return this.academicSessionsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all academic sessions' })
  findAll(@Query() query?: PaginationOptions) {
    return this.academicSessionsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the currently active academic session' })
  @ApiResponse({ status: 200, description: 'Active session retrieved successfully' })
  @ApiResponse({ status: 404, description: 'No active session found' })
  getActiveSession() {
    return this.academicSessionsService.getActiveSession();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get academic session by ID' })
  findOne(@Param('id') id: string) {
    return this.academicSessionsService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get statistics for a specific academic session' })
  @ApiResponse({
    status: 200,
    description: 'Session statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        totalSchedules: { type: 'number', example: 150 },
        totalExams: { type: 'number', example: 150 },
        schedulesBySemester: {
          type: 'object',
          properties: {
            FIRST: { type: 'number', example: 75 },
            SECOND: { type: 'number', example: 75 },
          },
        },
        examsBySemester: {
          type: 'object',
          properties: {
            FIRST: { type: 'number', example: 75 },
            SECOND: { type: 'number', example: 75 },
          },
        },
      },
    },
  })
  getStatistics(@Param('id') id: string) {
    return this.academicSessionsService.getSessionStatistics(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update academic session' })
  update(@Param('id') id: string, @Body() updateDto: UpdateAcademicSessionDto) {
    return this.academicSessionsService.update(id, updateDto);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Set academic session as active' })
  @ApiResponse({
    status: 200,
    description: 'Session activated successfully (all other sessions deactivated)',
  })
  setActive(@Param('id') id: string) {
    return this.academicSessionsService.setActiveSession(id);
  }

  @Patch(':id/archive')
  @ApiOperation({ summary: 'Archive academic session' })
  @ApiResponse({ status: 200, description: 'Session archived successfully' })
  archive(@Param('id') id: string) {
    return this.academicSessionsService.archiveSession(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete academic session' })
  @ApiResponse({
    status: 200,
    description: 'Session deleted successfully (only if no schedules/exams)',
  })
  remove(@Param('id') id: string) {
    return this.academicSessionsService.remove(id);
  }
}
