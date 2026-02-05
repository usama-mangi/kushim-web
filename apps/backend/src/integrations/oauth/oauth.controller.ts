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
    console.log(`[OAuthController] Received callback for ${platform}`);
    if (!code || !state) {
      console.error(`[OAuthController] Missing code or state for ${platform}`);
      throw new BadRequestException('Missing code or state');
    }

    try {
      // Decrypt state to get customerId
      console.log(`[OAuthController] Decrypting state: ${state}`);
      const decryptedState = JSON.parse(decrypt(state));
      const { customerId } = decryptedState;
      console.log(`[OAuthController] Decrypted customerId: ${customerId}`);

      if (!customerId) {
        console.error(`[OAuthController] CustomerId missing in state for ${platform}`);
        throw new BadRequestException('Invalid state: customerId missing');
      }

      console.log(`[OAuthController] Exchanging token for ${platform}...`);
      const result = await this.oauthService.exchangeToken(platform, code, customerId);
      console.log(`[OAuthController] Token exchange successful for ${platform}. Result:`, result);

      // Redirect back to frontend
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      const setupParam = (result as any)?.setupRequired ? '&setup_required=true' : '';
      const redirectUrl = `${frontendUrl}/integrations?success=true&platform=${platform}${setupParam}`;
      console.log(`[OAuthController] Redirecting to: ${redirectUrl}`);
      return res.redirect(redirectUrl);
    } catch (error) {
      console.error(`[OAuthController] FAILED for ${platform}:`, error);
      const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/integrations?error=oauth_failed&platform=${platform}`);
    }
  }
}
