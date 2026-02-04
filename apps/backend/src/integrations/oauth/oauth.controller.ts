import { Controller, Get, Param, Request, UseGuards, Res, Query, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import type { Response } from 'express';
import { decrypt } from '../../shared/utils/encryption.util';
import { ConfigService } from '@nestjs/config';

@Controller('integrations/oauth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get(':platform/authorize')
  @UseGuards(AuthGuard('jwt'))
  async authorize(
    @Param('platform') platform: string,
    @Request() req: any,
  ) {
    const url = await this.oauthService.getAuthorizeUrl(platform, req.user.customerId);
    return { url };
  }

  @Get(':platform/callback')
  async callback(
    @Param('platform') platform: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state');
    }

    try {
      // Decrypt state to get customerId
      const decryptedState = JSON.parse(decrypt(state));
      const { customerId } = decryptedState;

      if (!customerId) {
        throw new BadRequestException('Invalid state: customerId missing');
      }

      await this.oauthService.exchangeToken(platform, code, customerId);

      // Redirect back to frontend
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/integrations?success=true&platform=${platform}`);
    } catch (error) {
      console.error(`OAuth callback error for ${platform}:`, error);
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/integrations?error=oauth_failed&platform=${platform}`);
    }
  }
}
