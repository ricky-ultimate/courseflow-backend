import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub: string;
  matricNO?: string;
  email: string;
  role: string;
}

interface ValidatedUser {
  id: string;
  matricNO?: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('app.jwt.secret')!,
    });
  }

  validate(payload: JwtPayload): ValidatedUser {
    return {
      id: payload.sub,
      matricNO: payload.matricNO,
      email: payload.email,
      role: payload.role,
    };
  }
}
