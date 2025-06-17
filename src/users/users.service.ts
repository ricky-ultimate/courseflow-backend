import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseService } from '../common/services/base.service';
import { User } from '../generated/prisma';
import * as argon2 from 'argon2';

@Injectable()
export class UsersService extends BaseService<
  User,
  CreateUserDto,
  UpdateUserDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      modelName: 'user',
      identifierField: 'matricNO',
      uniqueFields: ['matricNO', 'email'],
      softDelete: true,
      defaultOrderBy: { createdAt: 'desc' },
    });
  }

  protected async beforeCreate(dto: CreateUserDto): Promise<any> {
    return {
      ...dto,
      password: await argon2.hash(dto.password),
    };
  }

  async findAll(options?: any) {
    const result = await super.findAll(options);
    return this.excludePasswords(result);
  }

  async findOne(matricNO: string) {
    const user = await super.findOne(matricNO);
    return this.excludePassword(user);
  }

  private excludePassword(user: any) {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private excludePasswords(users: any) {
    if (Array.isArray(users)) {
      return users.map((user) => this.excludePassword(user));
    }
    if (users.data) {
      return {
        ...users,
        data: users.data.map((user: any) => this.excludePassword(user)),
      };
    }
    return users;
  }
}
