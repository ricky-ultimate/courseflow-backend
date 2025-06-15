import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const hashedPassword = await argon2.hash(dto.password);

    return this.prisma.user.create({
      data: {
        ...dto,
        password: hashedPassword,
      },
      select: {
        id: true,
        matricNO: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        matricNO: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(matricNO: string) {
    const user = await this.prisma.user.findUnique({
      where: { matricNO },
      select: {
        id: true,
        matricNO: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async update(matricNO: string, dto: UpdateUserDto) {
    await this.findOne(matricNO); // Check if user exists

    return this.prisma.user.update({
      where: { matricNO },
      data: dto,
      select: {
        id: true,
        matricNO: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async remove(matricNO: string) {
    await this.findOne(matricNO); // Check if user exists

    return this.prisma.user.update({
      where: { matricNO },
      data: { isActive: false },
    });
  }
}
