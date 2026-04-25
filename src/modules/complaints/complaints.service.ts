// src/modules/complaints/complaints.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { BaseService } from '../../common/services/base.service';
import { Complaint } from '../../generated/prisma';

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
      includeRelations: {
        user: { select: { id: true, name: true, email: true } },
      },
      defaultOrderBy: { createdAt: 'desc' },
    });
  }

  async createForUser(
    dto: CreateComplaintDto,
    userId: string,
  ): Promise<Complaint> {
    return this.prisma.complaint.create({
      data: { ...dto, userId },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }

  async updateByAdmin(
    id: string,
    dto: UpdateComplaintDto,
    adminUserId: string,
  ): Promise<Complaint> {
    await this.findOne(id);

    const data: Record<string, unknown> = { ...dto };

    if (dto.status === 'RESOLVED') {
      data.resolvedBy = adminUserId;
      data.resolvedAt = new Date();
    }

    return this.prisma.complaint.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true } } },
    }) as Promise<Complaint>;
  }

  async findUserComplaints(userId: string): Promise<Complaint[]> {
    return this.prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPending(): Promise<Complaint[]> {
    return this.prisma.complaint.findMany({
      where: { status: 'PENDING' },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findResolved(): Promise<Complaint[]> {
    return this.prisma.complaint.findMany({
      where: { status: 'RESOLVED' },
      orderBy: { resolvedAt: 'desc' },
    });
  }
}
