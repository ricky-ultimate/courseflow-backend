import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { BaseService } from '../../common/services/base.service';
import { College, User, Role } from '../../generated/prisma';
import {
  PaginationOptions,
  PaginatedResult,
} from '../../common/interfaces/base-service.interface';
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
      identifierField: 'id',
      uniqueFields: ['matricNO', 'email'],
      softDelete: true,
      defaultOrderBy: { createdAt: 'desc' },
      includeRelations: {
        department: { select: { name: true, code: true, college: true } },
      },
    });
  }

  protected async beforeCreate(
    dto: CreateUserDto,
  ): Promise<Record<string, any>> {
    const role = dto.role ?? Role.STUDENT;

    if (role === Role.STUDENT || role === Role.LECTURER || role === Role.HOD) {
      if (!dto.departmentCode) {
        throw new BadRequestException(
          `Department code is required for ${role} role`,
        );
      }
      const dept = await this.prisma.department.findUnique({
        where: { code: dto.departmentCode },
      });
      if (!dept) {
        throw new NotFoundException(
          `Department '${dto.departmentCode}' not found`,
        );
      }
    }

    if (role === Role.COLLEGE_ADMIN && !dto.collegeCode) {
      throw new BadRequestException(
        'College code is required for COLLEGE_ADMIN role',
      );
    }

    return {
      ...dto,
      password: await argon2.hash(dto.password),
    };
  }

  protected async beforeUpdate(
    dto: UpdateUserDto,
    _identifier: string,
  ): Promise<Record<string, any>> {
    const data: Record<string, any> = { ...dto };

    if (dto.departmentCode) {
      const dept = await this.prisma.department.findUnique({
        where: { code: dto.departmentCode },
      });
      if (!dept) {
        throw new NotFoundException(
          `Department '${dto.departmentCode}' not found`,
        );
      }
    }

    return data;
  }

  async findAll(
    options?: PaginationOptions & {
      role?: Role;
      departmentCode?: string;
      isActive?: boolean;
      collegeScope?: College;
    },
  ): Promise<User[] | PaginatedResult<User>> {
    const where: Record<string, any> = { ...this.getActiveFilter() };

    if (options?.isActive !== undefined) where.isActive = options.isActive;

    if (options?.collegeScope) {
      where.role = { in: [Role.LECTURER, Role.HOD] };
      where.department = { college: options.collegeScope };
    } else {
      if (options?.role) where.role = options.role;
      if (options?.departmentCode)
        where.departmentCode = options.departmentCode;
    }

    if (options?.page && options?.limit) {
      return this.findPaginated(where, options);
    }

    return this.getModel().findMany({
      where,
      include: this.config.includeRelations,
      orderBy: this.getOrderBy(options),
    }) as Promise<User[]>;
  }

  async findAllWithoutPasswords(
    options?: PaginationOptions & {
      role?: Role;
      departmentCode?: string;
      isActive?: boolean;
    },
    requestingUser?: { role: string; collegeCode?: College },
  ): Promise<
    Omit<User, 'password'>[] | PaginatedResult<Omit<User, 'password'>>
  > {
    const collegeScope =
      requestingUser?.role === Role.COLLEGE_ADMIN && requestingUser.collegeCode
        ? requestingUser.collegeCode
        : undefined;

    const result = await this.findAll({ ...options, collegeScope });
    return this.excludePasswords(result);
  }

  async findOneWithoutPassword(id: string): Promise<Omit<User, 'password'>> {
    const user = await super.findOne(id);
    return this.excludePassword(user);
  }

  async getDashboardStats(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
    });

    if (!user) throw new NotFoundException('User not found');

    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });

    const sessionFilter = activeSession ? { sessionId: activeSession.id } : {};

    const courses = await this.prisma.course.findMany({
      where: { lecturerId: userId, isActive: true },
      include: { schedules: { where: sessionFilter } },
    });

    const DAY_ORDER: Record<string, number> = {
      SUNDAY: 0,
      MONDAY: 1,
      TUESDAY: 2,
      WEDNESDAY: 3,
      THURSDAY: 4,
      FRIDAY: 5,
      SATURDAY: 6,
    };

    const DAY_NAMES = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    const todayUtcDay = new Date().getUTCDay();
    const todayDayName = DAY_NAMES[todayUtcDay];

    const coursesByLevel: Record<string, number> = {};
    const schedulesByDay: Record<string, number> = {};
    let totalSchedules = 0;
    let upcomingClasses = 0;

    for (const course of courses) {
      coursesByLevel[course.level] = (coursesByLevel[course.level] ?? 0) + 1;

      for (const schedule of course.schedules) {
        schedulesByDay[schedule.dayOfWeek] =
          (schedulesByDay[schedule.dayOfWeek] ?? 0) + 1;
        totalSchedules++;

        if (
          (DAY_ORDER[schedule.dayOfWeek] ?? 0) >= (DAY_ORDER[todayDayName] ?? 0)
        ) {
          upcomingClasses++;
        }
      }
    }

    return {
      totalCourses: courses.length,
      totalSchedules,
      coursesByLevel,
      schedulesByDay,
      upcomingClasses,
    };
  }

  async getMyCourses(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const courses = await this.prisma.course.findMany({
      where: { lecturerId: userId, isActive: true },
      include: {
        department: true,
        schedules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
      },
      orderBy: [{ level: 'asc' }, { code: 'asc' }],
    });

    return {
      lecturer: {
        id: user.id,
        name: user.name,
        email: user.email,
        departmentCode: user.departmentCode,
      },
      courses,
    };
  }

  async getMySchedule(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isActive: true },
    });
    if (!user) throw new NotFoundException('User not found');

    const activeSession = await this.prisma.academicSession.findFirst({
      where: { isActive: true },
    });
    const sessionFilter = activeSession ? { sessionId: activeSession.id } : {};

    const schedules = await this.prisma.schedule.findMany({
      where: {
        course: { lecturerId: userId, isActive: true },
        ...sessionFilter,
      },
      include: { course: { include: { department: true } } },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });

    const schedulesByDay: Record<string, any[]> = {
      MONDAY: [],
      TUESDAY: [],
      WEDNESDAY: [],
      THURSDAY: [],
      FRIDAY: [],
      SATURDAY: [],
      SUNDAY: [],
    };
    schedules.forEach((s) => schedulesByDay[s.dayOfWeek].push(s));

    return {
      lecturer: {
        id: user.id,
        name: user.name,
        email: user.email,
        departmentCode: user.departmentCode,
      },
      activeSession: activeSession
        ? { id: activeSession.id, name: activeSession.name }
        : null,
      schedulesByDay,
      totalSchedules: schedules.length,
    };
  }

  private excludePassword(user: User): Omit<User, 'password'> {
    const { password, ...rest } = user;
    void password;
    return rest;
  }

  private excludePasswords(
    users: User[] | PaginatedResult<User>,
  ): Omit<User, 'password'>[] | PaginatedResult<Omit<User, 'password'>> {
    if (Array.isArray(users)) return users.map((u) => this.excludePassword(u));
    if ('data' in users)
      return {
        ...users,
        data: users.data.map((u: User) => this.excludePassword(u)),
      };
    return users as Omit<User, 'password'>[];
  }
}
