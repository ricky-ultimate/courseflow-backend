import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/database/prisma.service';
import { Role } from '../../generated/prisma';
import { SKIP_HOD_GUARD_KEY } from '../decorators/skip-hod-guard.decorator';

interface RequestWithUser {
  user?: { id: string; role: Role; email: string };
  params?: { code?: string; id?: string };
  body?: { departmentCode?: string; courseCode?: string };
  method: string;
}

@Injectable()
export class HodDepartmentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_HOD_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skip) return true;

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user, method } = request;

    if (!user || user.role !== Role.HOD) return true;
    if (method === 'GET') return true;

    const hodUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { managedDepartment: true },
    });

    if (!hodUser?.managedDepartment) {
      throw new ForbiddenException('HOD must be assigned to a department');
    }

    const hodDeptCode = hodUser.managedDepartment.code;
    const resourceDeptCode = await this.getResourceDepartmentCode(request);

    if (resourceDeptCode === null) {
      throw new ForbiddenException(
        'HODs can only modify resources in their own department',
      );
    }

    if (resourceDeptCode !== hodDeptCode) {
      throw new ForbiddenException(
        `HODs can only modify resources in their own department (${hodDeptCode})`,
      );
    }

    return true;
  }

  private async getResourceDepartmentCode(
    request: RequestWithUser,
  ): Promise<string | null> {
    const { params, body } = request;

    if (body?.departmentCode) return body.departmentCode;

    if (body?.courseCode) {
      const course = await this.prisma.course.findUnique({
        where: { code: body.courseCode },
        select: { departmentCode: true },
      });
      return course?.departmentCode ?? null;
    }

    if (params?.code) {
      const course = await this.prisma.course.findUnique({
        where: { code: params.code },
        select: { departmentCode: true },
      });
      if (course) return course.departmentCode;

      const department = await this.prisma.department.findUnique({
        where: { code: params.code },
        select: { code: true },
      });
      if (department) return department.code;

      return null;
    }

    if (params?.id) {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: params.id },
        select: { course: { select: { departmentCode: true } } },
      });
      if (schedule) return schedule.course.departmentCode;

      const examSchedule = await this.prisma.examSchedule.findUnique({
        where: { id: params.id },
        select: { course: { select: { departmentCode: true } } },
      });
      if (examSchedule) return examSchedule.course.departmentCode;
    }

    return null;
  }
}
