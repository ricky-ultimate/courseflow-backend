import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { CRUD_ROLES_KEY, CrudRolesConfig } from '../decorators/crud-roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      const crudRoles = this.reflector.get<CrudRolesConfig>(CRUD_ROLES_KEY, context.getClass());
      if (crudRoles) {
        const methodRoles = this.getCrudMethodRoles(context, crudRoles);
        if (methodRoles && methodRoles.length > 0) {
          return this.validateUserRoles(context, methodRoles);
        }
      }
      return true;
    }

    return this.validateUserRoles(context, requiredRoles);
  }

  private getCrudMethodRoles(context: ExecutionContext, crudRoles: CrudRolesConfig): Role[] | null {
    const methodName = context.getHandler().name;

    switch (methodName) {
      case 'create':
        return crudRoles.create || null;
      case 'findAll':
      case 'findOne':
        return crudRoles.read || null;
      case 'update':
        return crudRoles.update || null;
      case 'remove':
        return crudRoles.delete || null;
      default:
        return null;
    }
  }

  private validateUserRoles(context: ExecutionContext, requiredRoles: Role[]): boolean {
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
  }
}
