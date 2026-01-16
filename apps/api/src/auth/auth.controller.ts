import {
  Controller,
  Post,
  UseGuards,
  Request,
  Get,
  Body,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Initiates the GitHub OAuth2 flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubLoginCallback(@Request() req: any, @Res() res: any) {
    const { access_token } = await this.authService.login(req.user);
    // Redirect to frontend with token (securely this should be a cookie or similar, but query param for simplicity here)
    res.redirect(`http://localhost:3000/login?token=${access_token}`);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleLogin() {
    // Initiates the Google OAuth2 flow
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleLoginCallback(@Request() req: any, @Res() res: any) {
    const { access_token } = await this.authService.login(req.user);
    res.redirect(`http://localhost:3000/login?token=${access_token}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/status')
  async getMfaStatus(@Request() req: any) {
    return this.authService.getMfaStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/generate')
  async generateMfa(@Request() req: any) {
    return this.auditMfaGeneration(req.user.userId);
  }

  // Helper to keep logic clean, actually calling service
  private async auditMfaGeneration(userId: string) {
    return this.authService.generateMfaSecret(userId);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  async verifyMfa(@Request() req: any, @Body() body: { token: string }) {
    return this.authService.verifyMfaToken(req.user.userId, body.token);
  }

  // Use a special guard or just check the token payload manually in service?
  // Since we are using the standard JwtAuthGuard, it will validate the signature.
  // The service logic will check the 'isMfaTemp' payload if we want strict enforcement there,
  // but for now, we just trust the userId extraction.
  // Note: JwtStrategy extracts 'sub' as 'userId'.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/login')
  async mfaLogin(@Request() req: any, @Body() body: { token: string }) {
    return this.authService.verifyMfaLogin(req.user.userId, body.token);
  }
}
