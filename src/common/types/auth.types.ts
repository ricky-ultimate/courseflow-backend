import { Request } from 'express';
import { College, User } from '../../generated/prisma';

export interface AuthenticatedRequest extends Request {
  user: User & { collegeCode?: College };
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  collegeCode?: College;
}
