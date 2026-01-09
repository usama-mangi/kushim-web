import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(private authService: AuthService) {
    super({
      clientID: process.env.GITHUB_CLIENT_ID || 'mock_id',
      clientSecret: process.env.GITHUB_CLIENT_SECRET || 'mock_secret',
      callbackURL: process.env.API_URL 
        ? `${process.env.API_URL}/auth/github/callback` 
        : 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, refreshToken: string, profile: any): Promise<any> {
    const email = profile.emails[0].value;
    // In a real app, we would also verify or create the user here via AuthService
    // For now, let's assume we map by email or create a new user.
    const user = await this.authService.validateOrCreateSocialUser(email, 'github');
    return user;
  }
}
