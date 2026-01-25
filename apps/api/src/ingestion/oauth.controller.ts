import { 
  Controller, 
  Get, 
  Param, 
  Query, 
  UseGuards, 
  Request, 
  Res,
  BadRequestException,
  Logger
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OAuthService } from './oauth.service';

@Controller('ingestion/oauth')
export class OAuthController {
  private readonly logger = new Logger(OAuthController.name);

  constructor(private oauthService: OAuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get(':provider/connect')
  async connect(
    @Request() req: any,
    @Param('provider') provider: string,
  ) {
    const url = await this.oauthService.getAuthUrl(provider, req.user.userId);
    return { url };
  }

  @Get(':provider/callback')
  async callback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Default Next.js port

    if (error) {
      return res.redirect(`${frontendUrl}/sources?error=${error}`);
    }

    if (!code || !state) {
      return res.redirect(`${frontendUrl}/sources?error=missing_params`);
    }

    try {
      await this.oauthService.handleCallback(provider, code, state);
      return res.redirect(`${frontendUrl}/sources?success=true&provider=${provider}`);
    } catch (err: any) {
      this.logger.error(`OAuth Callback Error for ${provider}`, err.stack || err);
      return res.redirect(`${frontendUrl}/sources?error=${encodeURIComponent(err.message || 'Unknown error')}`);
    }
  }
}
