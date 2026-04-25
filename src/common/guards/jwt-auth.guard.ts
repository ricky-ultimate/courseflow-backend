import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import {
  CRUD_ROLES_KEY,
  CrudRolesConfig,
} from '../decorators/crud-roles.decorator';
import { Role } from '../../generated/prisma';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const crudRoles = this.reflector.get<CrudRolesConfig>(
      CRUD_ROLES_KEY,
      context.getClass(),
    );

    if (crudRoles) {
      const method = context
        .switchToHttp()
        .getRequest<{ method: string }>().method;

      const roleMap: Record<string, Role[] | undefined> = {
        POST: crudRoles.create,
        GET: crudRoles.read,
        PUT: crudRoles.update,
        PATCH: crudRoles.update,
        DELETE: crudRoles.delete,
      };

      const requiredRoles = roleMap[method];

      if (requiredRoles !== undefined && requiredRoles.length === 0) {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
