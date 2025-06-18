import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseService } from '../common/services/base.service';
import { User } from '../generated/prisma';
import {
  PaginationOptions,
  PaginatedResult,
} from '../common/interfaces/base-service.interface';
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

  protected async beforeCreate(
    dto: CreateUserDto,
  ): Promise<Record<string, any>> {
    return {
      ...dto,
      password: await argon2.hash(dto.password),
    };
  }

  async findAllWithoutPasswords(
    options?: PaginationOptions,
  ): Promise<
    Omit<User, 'password'>[] | PaginatedResult<Omit<User, 'password'>>
  > {
    const result = await super.findAll(options);
    return this.excludePasswords(result);
  }

  async findOneWithoutPassword(
    matricNO: string,
  ): Promise<Omit<User, 'password'>> {
    const user = await super.findOne(matricNO);
    return this.excludePassword(user);
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  private excludePasswords(
    users: User[] | PaginatedResult<User>,
  ): Omit<User, 'password'>[] | PaginatedResult<Omit<User, 'password'>> {
    if (Array.isArray(users)) {
      return users.map((user) => this.excludePassword(user));
    }
    if ('data' in users) {
      return {
        ...users,
        data: users.data.map((user: User) => this.excludePassword(user)),
      };
    }
    return users as Omit<User, 'password'>[];
  }
}
