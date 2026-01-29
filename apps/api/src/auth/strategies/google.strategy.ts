import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { GoogleProfile } from '../../types';
import { User } from '@prisma/client';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID || 'mock_id',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'mock_secret',
      callbackURL: process.env.API_URL
        ? `${process.env.API_URL}/auth/google/callback`
        : 'http://localhost:3000/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
  ): Promise<User> {
    const email = profile.emails[0].value;
    const user = await this.authService.validateOrCreateSocialUser(
      email,
      'google',
    );
    return user;
  }
}
