import {
  Controller,
  Get,
  Req,
  Query,
  Body,
  Post,
  Patch,
  Param,
  ParseEnumPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { Complaint, ComplaintStatus, Role } from '../../generated/prisma';
import { AuthenticatedRequest } from '../../common/types/auth.types';
import { PaginationOptions } from '../../common/interfaces/base-service.interface';
import { SkipHodGuard } from '../../common/decorators/skip-hod-guard.decorator';
import { SkipCollegeGuard } from '../../common/decorators/skip-college-guard.decorator';
import { PaginatedResult } from '../../common/interfaces/base-service.interface';

@ApiTags('Complaints')
@ApiBearerAuth('JWT-auth')
@Controller('complaints')
@SkipCollegeGuard()
@SkipHodGuard()
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Get all complaints (Admin / College Admin)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  findAll(
    @Query() query: PaginationOptions,
  ): Promise<Complaint[] | PaginatedResult<Complaint>> {
    return this.complaintsService.findAll(query);
  }

  @Get('my-complaints')
  @Roles(Role.STUDENT, Role.ADMIN, Role.HOD, Role.LECTURER, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Get my complaints' })
  findUserComplaints(@Req() req: AuthenticatedRequest): Promise<Complaint[]> {
    return this.complaintsService.findUserComplaints(req.user.id);
  }

  @Get('pending')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Get pending complaints (Admin / College Admin)' })
  findPending(): Promise<Complaint[]> {
    return this.complaintsService.findPending();
  }

  @Get('resolved')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Get resolved complaints (Admin / College Admin)' })
  findResolved(): Promise<Complaint[]> {
    return this.complaintsService.findResolved();
  }

  @Post()
  @Roles(Role.STUDENT, Role.ADMIN, Role.HOD, Role.LECTURER, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiBody({ type: CreateComplaintDto })
  create(
    @Body() createDto: CreateComplaintDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Complaint> {
    return this.complaintsService.createForUser(createDto, req.user.id);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiOperation({ summary: 'Get complaint by ID (Admin / College Admin)' })
  findOne(@Param('id') id: string): Promise<Complaint> {
    return this.complaintsService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiOperation({ summary: 'Update complaint (Admin / College Admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateComplaintDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<Complaint> {
    return this.complaintsService.updateByAdmin(id, dto, req.user.id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.COLLEGE_ADMIN)
  @ApiOperation({ summary: 'Update complaint status (Admin / College Admin)' })
  @ApiParam({ name: 'id', description: 'Complaint ID' })
  @ApiQuery({
    name: 'status',
    enum: ComplaintStatus,
    description: 'New status for the complaint',
  })
  updateStatus(
    @Param('id') id: string,
    @Query('status', new ParseEnumPipe(ComplaintStatus))
    status: ComplaintStatus,
    @Req() req: AuthenticatedRequest,
  ): Promise<Complaint> {
    return this.complaintsService.updateByAdmin(id, { status }, req.user.id);
  }
}
