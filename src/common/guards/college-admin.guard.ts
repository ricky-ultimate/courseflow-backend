import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/database/prisma.service';
import { College, Role } from '../../generated/prisma';
import { SKIP_COLLEGE_GUARD_KEY } from '../decorators/skip-college-guard.decorator';

interface RequestWithUser {
  user?: {
    id: string;
    role: Role;
    email: string;
    collegeCode?: College;
  };
  params?: { code?: string; id?: string };
  body?: {
    departmentCode?: string;
    courseCode?: string;
    college?: College;
    collegeCode?: College;
  };
  method: string;
}

@Injectable()
export class CollegeAdminGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_COLLEGE_GUARD_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (skip) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user, method } = request;

    if (!user || user.role !== Role.COLLEGE_ADMIN) return true;
    if (method === 'GET') return true;

    if (!user.collegeCode) {
      throw new ForbiddenException(
        'College admin must be assigned to a college',
      );
    }

    const resourceCollege = await this.resolveResourceCollege(request);

    if (resourceCollege === null) {
      throw new ForbiddenException(
        'College admins can only modify resources within their own college',
      );
    }

    if (resourceCollege !== user.collegeCode) {
      throw new ForbiddenException(
        `College admins can only modify resources within their own college (${user.collegeCode})`,
      );
    }

    return true;
  }

  private async resolveResourceCollege(
    request: RequestWithUser,
  ): Promise<College | null> {
    const { params, body } = request;

    if (body?.college) return body.college as College;
    if (body?.collegeCode) return body.collegeCode as College;

    if (body?.departmentCode) {
      const dept = await this.prisma.department.findUnique({
        where: { code: body.departmentCode },
        select: { college: true },
      });
      return dept?.college ?? null;
    }

    if (body?.courseCode) {
      const course = await this.prisma.course.findUnique({
        where: { code: body.courseCode },
        include: { department: { select: { college: true } } },
      });
      return course?.department?.college ?? null;
    }

    if (params?.code) {
      const dept = await this.prisma.department.findUnique({
        where: { code: params.code },
        select: { college: true },
      });
      if (dept) return dept.college;

      const course = await this.prisma.course.findUnique({
        where: { code: params.code },
        include: { department: { select: { college: true } } },
      });
      if (course) return course.department?.college ?? null;
    }

    if (params?.id) {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: params.id },
        include: {
          course: { include: { department: { select: { college: true } } } },
        },
      });
      if (schedule) return schedule.course.department?.college ?? null;

      const examSchedule = await this.prisma.examSchedule.findUnique({
        where: { id: params.id },
        include: {
          course: { include: { department: { select: { college: true } } } },
        },
      });
      if (examSchedule) return examSchedule.course.department?.college ?? null;
    }

    return null;
  }
}
