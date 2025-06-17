import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';
import {
  CRUD_ROLES_KEY,
  CrudRolesConfig,
} from '../../common/decorators/crud-roles.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const crudRoles = this.reflector.get<CrudRolesConfig>(
      CRUD_ROLES_KEY,
      context.getClass(),
    );
    if (crudRoles) {
      const request = context.switchToHttp().getRequest();
      const httpMethod = request.method;

      let requiredRoles: any[] | undefined;
      switch (httpMethod) {
        case 'POST':
          requiredRoles = crudRoles.create;
          break;
        case 'GET':
          requiredRoles = crudRoles.read;
          break;
        case 'PUT':
        case 'PATCH':
          requiredRoles = crudRoles.update;
          break;
        case 'DELETE':
          requiredRoles = crudRoles.delete;
          break;
      }

      if (requiredRoles && requiredRoles.length === 0) {
        return true;
      }
    }

    return super.canActivate(context);
  }
}
