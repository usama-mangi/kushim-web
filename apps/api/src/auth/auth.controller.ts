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
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthenticatedRequest } from '../types';

interface RegisterDto {
  email: string;
  password: string;
  username?: string;
}

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Login with email and password' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login successful, returns JWT token' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: AuthenticatedRequest) {
    return this.authService.login(req.user);
  }

  @ApiOperation({ summary: 'Register a new user account' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
        password: { type: 'string', example: 'password123' },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input or user already exists' })
  @Post('register')
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body.email, body.password);
  }

  @ApiOperation({ summary: 'Request password reset email' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'user@example.com' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @ApiOperation({ summary: 'Initiate GitHub OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirects to GitHub OAuth' })
  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() {
    // Initiates the GitHub OAuth2 flow
  }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubLoginCallback(@Request() req: AuthenticatedRequest, @Res() res: Response) {
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
  async googleLoginCallback(@Request() req: AuthenticatedRequest, @Res() res: Response) {
    const { access_token } = await this.authService.login(req.user);
    res.redirect(`http://localhost:3000/login?token=${access_token}`);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Get('mfa/status')
  async getMfaStatus(@Request() req: AuthenticatedRequest) {
    return this.authService.getMfaStatus(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('mfa/generate')
  async generateMfa(@Request() req: AuthenticatedRequest) {
    return this.auditMfaGeneration(req.user.userId);
  }

  // Helper to keep logic clean, actually calling service
  private async auditMfaGeneration(userId: string) {
    return this.authService.generateMfaSecret(userId);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @UseGuards(JwtAuthGuard)
  @Post('mfa/verify')
  async verifyMfa(@Request() req: AuthenticatedRequest, @Body() body: { token: string }) {
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
