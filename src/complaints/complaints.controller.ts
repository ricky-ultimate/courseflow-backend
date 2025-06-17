import { Controller, Get, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { BaseController } from '../common/controllers/base.controller';
import { CrudRoles } from '../common/decorators/crud-roles.decorator';
import { Complaint, Role } from '../generated/prisma';
import { AuthenticatedRequest } from '../common/types/auth.types';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Complaints')
@ApiBearerAuth()
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

  @Get('my-complaints')
  @Roles(Role.STUDENT, Role.ADMIN)
  @ApiOperation({ summary: 'Get my complaints' })
  findUserComplaints(@Req() req: AuthenticatedRequest) {
    return this.complaintsService.findUserComplaints(req.user.id);
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending complaints (Admin only)' })
  findPending() {
    return this.complaintsService.findPending();
  }

  @Get('resolved')
  @ApiOperation({ summary: 'Get resolved complaints (Admin only)' })
  findResolved() {
    return this.complaintsService.findResolved();
  }
}
