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
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { BaseController } from '../../common/controllers/base.controller';
import { CrudRoles } from '../../common/decorators/crud-roles.decorator';
import { AcademicSession, Role } from '../../generated/prisma';
import { PaginationOptions } from '../../common/interfaces/base-service.interface';

@ApiTags('Academic Sessions')
@ApiBearerAuth('JWT-auth')
@Controller('sessions')
@CrudRoles({
  entity: 'session',
  create: [Role.ADMIN],
  read: [],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class SessionsController extends BaseController<
  AcademicSession,
  CreateSessionDto,
  UpdateSessionDto
> {
  constructor(private readonly sessionsService: SessionsService) {
    super(sessionsService);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new academic session' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  create(@Body() createDto: CreateSessionDto) {
    return this.sessionsService.create(createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all academic sessions' })
  findAll(@Query() query?: PaginationOptions) {
    return this.sessionsService.findAll(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get the currently active session' })
  @ApiResponse({ status: 200, description: 'Active session retrieved' })
  getActiveSession() {
    return this.sessionsService.getActiveSession();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get session by ID' })
  findOne(@Param('id') id: string) {
    return this.sessionsService.findOne(id);
  }

  @Get(':id/statistics')
  @ApiOperation({ summary: 'Get session statistics' })
  @ApiResponse({ status: 200, description: 'Session statistics retrieved' })
  getStatistics(@Param('id') id: string) {
    return this.sessionsService.getSessionStatistics(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Set session as active (Admin only)' })
  @ApiResponse({ status: 200, description: 'Session activated successfully' })
  setActiveSession(@Param('id') id: string) {
    return this.sessionsService.setActiveSession(id);
  }

  @Post('start-new')
  @ApiOperation({ summary: 'Start a new academic session (Admin only)' })
  @ApiResponse({ status: 201, description: 'New session started' })
  startNewSession(@Body() dto: CreateSessionDto) {
    return this.sessionsService.startNewSession(dto.name);
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive a session (Admin only)' })
  @ApiResponse({ status: 200, description: 'Session archived successfully' })
  archiveSession(@Param('id') id: string) {
    return this.sessionsService.archiveSession(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update session' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSessionDto) {
    return this.sessionsService.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete session' })
  remove(@Param('id') id: string) {
    return this.sessionsService.remove(id);
  }
}
