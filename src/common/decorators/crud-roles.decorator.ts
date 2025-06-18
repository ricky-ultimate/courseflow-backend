import { SetMetadata } from '@nestjs/common';
import { Role } from '../../generated/prisma';

export const CRUD_ROLES_KEY = 'crud_roles';

export interface CrudRolesConfig {
  entity: string;
  create?: Role[];
  read?: Role[];
  update?: Role[];
  delete?: Role[];
}

export const CrudRoles = (config: CrudRolesConfig) =>
  SetMetadata(CRUD_ROLES_KEY, config);
