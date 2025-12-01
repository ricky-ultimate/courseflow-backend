import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Lecturer } from '../../generated/prisma';

@Injectable()
export class LecturerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByDepartment(departmentCode: string): Promise<Lecturer[]> {
    return this.prisma.lecturer.findMany({
      where: {
        isActive: true,
        departmentCode,
      },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  async findByEmail(email: string): Promise<Lecturer | null> {
    return this.prisma.lecturer.findUnique({
      where: { email },
      include: { department: true },
    });
  }

  async searchByName(searchTerm: string): Promise<Lecturer[]> {
    return this.prisma.lecturer.findMany({
      where: {
        isActive: true,
        name: {
          contains: searchTerm,
          mode: 'insensitive',
        },
      },
      include: { department: true },
      orderBy: { name: 'asc' },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.lecturer.count({
      where: {
        email,
      },
    });
    return count > 0;
  }

  async findOne(id: string): Promise<Lecturer | null> {
    return this.prisma.lecturer.findUnique({
      where: { id },
      include: { department: true },
    });
  }
}
