import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { BaseService } from '../common/services/base.service';
import { Complaint } from '../generated/prisma';

@Injectable()
export class ComplaintsService extends BaseService<
  Complaint,
  CreateComplaintDto,
  UpdateComplaintDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'complaint',
      identifierField: 'id',
      includeRelations: { user: true },
      defaultOrderBy: { createdAt: 'desc' },
    });
  }

  async create(dto: CreateComplaintDto, userId?: string) {
    const data = userId ? { ...dto, userId } : dto;
    return super.create(data);
  }

  async findUserComplaints(userId: string) {
    return this.prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending() {
    return this.prisma.complaint.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findResolved() {
    return this.prisma.complaint.findMany({
      where: { status: 'RESOLVED' },
      orderBy: { resolvedAt: 'desc' },
    });
  }

  protected async beforeUpdate(dto: UpdateComplaintDto, id: string) {
    const data: any = { ...dto };

    if (dto.status === 'RESOLVED' && !dto.resolvedBy) {
      data.resolvedAt = new Date();
    }

    return data;
  }
}
