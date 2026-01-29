import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtPayload, AuthenticatedUser } from '../../types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'secretKey', // In production, always use env
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    return { 
      userId: payload.sub, 
      email: payload.email, 
      username: payload.username 
    };
  }
}
