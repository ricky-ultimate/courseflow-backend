import { Request } from 'express';
import { User } from '../../generated/prisma';

export interface AuthenticatedRequest extends Request {
  user: User;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
