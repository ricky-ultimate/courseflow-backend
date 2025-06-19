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
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Complaint, ComplaintStatus, Role } from '../generated/prisma';
import { AuthenticatedRequest } from '../common/types/auth.types';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationOptions } from '../common/interfaces/base-service.interface';

@ApiTags('Complaints')
@ApiBearerAuth('JWT-auth')
@Controller('complaints')
@CrudRoles({
  entity: 'complaint',
  create: [Role.STUDENT, Role.ADMIN],
  read: [Role.ADMIN],
  update: [Role.ADMIN],
  delete: [Role.ADMIN],
})
export class ComplaintsController extends BaseController<
  Complaint,
  CreateComplaintDto,
  UpdateComplaintDto
> {
  constructor(private readonly complaintsService: ComplaintsService) {
    super(complaintsService);
  }

  @Get()
  @ApiOperation({ summary: 'Get all complaints (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  async findAll(@Query() query: PaginationOptions) {
    return this.complaintsService.findAll(query);
  }

  @Get('my-complaints')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'Get my complaints' })
  findUserComplaints(@Req() req: AuthenticatedRequest) {
    return this.complaintsService.findUserComplaints(req.user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending complaints (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  findPending() {
    return this.complaintsService.findPending();
  }

  @Get('resolved')
  @ApiOperation({ summary: 'Get resolved complaints (Admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'orderBy', required: false, type: String })
  @ApiQuery({ name: 'orderDirection', required: false, enum: ['asc', 'desc'] })
  findResolved() {
    return this.complaintsService.findResolved();
  }

  @Post()
  @ApiOperation({ summary: 'Create a new complaint' })
  @ApiBody({ type: CreateComplaintDto })
  create(@Body() createDto: CreateComplaintDto) {
    return this.complaintsService.create(createDto);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update complaint status (Admin only)',
    description:
      'Update the status of a complaint. Available statuses: PENDING, IN_PROGRESS, RESOLVED, CLOSED',
  })
  @ApiParam({
    name: 'id',
    description: 'Complaint ID',
    example: 'clxyz123abc456def789',
  })
  @ApiQuery({
    name: 'status',
    enum: ComplaintStatus,
    description: 'New status for the complaint',
    example: 'IN_PROGRESS',
  })
  updateStatus(
    @Param('id') id: string,
    @Query('status', new ParseEnumPipe(ComplaintStatus))
    status: ComplaintStatus,
  ) {
    return this.complaintsService.update(id, { status });
  }
}
