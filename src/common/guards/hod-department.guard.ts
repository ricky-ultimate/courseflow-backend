import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../modules/database/prisma.service';
import { Role } from '../../generated/prisma';

interface RequestWithUser {
  user?: {
    id: string;
    role: Role;
    email: string;
  };
  params?: {
    code?: string;
    id?: string;
  };
  body?: {
    departmentCode?: string;
    courseCode?: string;
  };
  method: string;
}

/**
 * Guard to ensure HODs can only modify resources in their own department
 * - Admins can access all departments
 * - HODs can only access their managed department
 * - Lecturers and Students have read-only access (enforced by RolesGuard)
 */
@Injectable()
export class HodDepartmentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const { user, method } = request;

    // If no user or user is not HOD, let other guards handle it
    if (!user || user.role !== Role.HOD) {
      return true;
    }

    // HODs can only perform write operations (POST, PATCH, PUT, DELETE)
    // Read operations (GET) are allowed for all departments
    if (method === 'GET') {
      return true;
    }

    // Get HOD's department
    const hodDepartment = await this.prisma.user.findUnique({
      where: { id: user.id },
      include: { managedDepartment: true },
    });

    if (!hodDepartment?.managedDepartment) {
      throw new ForbiddenException('HOD must be assigned to a department');
    }

    const hodDeptCode = hodDepartment.managedDepartment.code;

    // Check resource access based on endpoint
    const resourceDeptCode = await this.getResourceDepartmentCode(request);

    if (resourceDeptCode && resourceDeptCode !== hodDeptCode) {
      throw new ForbiddenException(
        `HODs can only modify resources in their own department (${hodDeptCode})`,
      );
    }

    return true;
  }

  /**
   * Extract the department code from the request
   * This checks params, body, and related resources (courses, schedules)
   */
  private async getResourceDepartmentCode(
    request: RequestWithUser,
  ): Promise<string | null> {
    const { params, body } = request;

    // Direct department code in body (course creation, schedule creation)
    if (body?.departmentCode) {
      return body.departmentCode;
    }

    // Course code in body (schedule creation)
    if (body?.courseCode) {
      const course = await this.prisma.course.findUnique({
        where: { code: body.courseCode },
        select: { departmentCode: true },
      });
      return course?.departmentCode || null;
    }

    // Course code in params (course update/delete)
    if (params?.code) {
      const course = await this.prisma.course.findUnique({
        where: { code: params.code },
        select: { departmentCode: true },
      });
      return course?.departmentCode || null;
    }

    // Schedule ID in params (schedule update/delete)
    if (params?.id) {
      const schedule = await this.prisma.schedule.findUnique({
        where: { id: params.id },
        include: { course: { select: { departmentCode: true } } },
      });
      return schedule?.course.departmentCode || null;
    }

    return null;
  }
}
