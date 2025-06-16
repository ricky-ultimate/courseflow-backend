import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { User } from '../generated/prisma';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateComplaintDto, userId?: string) {
    return this.prisma.complaint.create({
      data: {
        ...dto,
        userId,
      },
    });
  }

  async findAll() {
    return this.prisma.complaint.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true },
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

  async findUserComplaints(userId: string) {
    return this.prisma.complaint.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!complaint) {
      throw new NotFoundException('Complaint not found');
    }

    return complaint;
  }

  async update(id: string, dto: UpdateComplaintDto, user: User) {
    await this.findOne(id);

    const data: any = { ...dto };

    if (dto.status === 'RESOLVED' && !dto.resolvedBy) {
      data.resolvedBy = user.id;
      data.resolvedAt = new Date();
    }

    return this.prisma.complaint.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.complaint.delete({
      where: { id },
    });
  }
}
