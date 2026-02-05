import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IntegrationsService } from '../integrations.service';
import { IntegrationType } from '@prisma/client';
import axios from 'axios';
import { encrypt } from '../../shared/utils/encryption.util';

@Injectable()
export class OAuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly integrationsService: IntegrationsService,
  ) {}

  private getRedirectUri(platform: string): string {
    const backendUrl =
      this.configService.get<string>('BACKEND_URL') || 'http://localhost:3001';
    return `${backendUrl}/api/integrations/oauth/${platform}/callback`;
  }

  async getAuthorizeUrl(platform: string, customerId: string): Promise<string> {
    // Encrypt state to prevent CSRF and store customerId
    const state = encrypt(
      JSON.stringify({ customerId, platform, timestamp: Date.now() }),
    );

    switch (platform.toLowerCase()) {
      case 'github':
        return `https://github.com/login/oauth/authorize?client_id=${this.configService.get(
          'GITHUB_CLIENT_ID',
        )}&redirect_uri=${this.getRedirectUri('github')}&state=${state}&scope=repo,read:org,admin:repo_hook`;

      case 'slack':
        return `https://slack.com/oauth/v2/authorize?client_id=${this.configService.get(
          'SLACK_CLIENT_ID',
        )}&scope=incoming-webhook,commands,chat:write&user_scope=&redirect_uri=${this.getRedirectUri(
          'slack',
        )}&state=${state}`;

      case 'jira':
        return `https://auth.atlassian.com/authorize?audience=api.atlassian.com&client_id=${this.configService.get(
          'JIRA_CLIENT_ID',
        )}&scope=read:jira-work%20write:jira-work%20manage:jira-configuration&redirect_uri=${this.getRedirectUri(
          'jira',
        )}&state=${state}&response_type=code&prompt=consent`;

      case 'okta':
        const oktaDomain = this.configService.get('OKTA_DOMAIN');
        if (!oktaDomain)
          throw new BadRequestException('Okta domain not configured on server');
        return `https://${oktaDomain}/oauth2/v1/authorize?client_id=${this.configService.get(
          'OKTA_CLIENT_ID',
        )}&response_type=code&scope=openid%20profile%20email%20okta.users.read%20okta.groups.read&redirect_uri=${this.getRedirectUri(
          'okta',
        )}&state=${state}`;

      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  async handleCallback(platform: string, code: string, state: string) {
    // In a real app, we'd decrypt 'state' to get the customerId and verify it's valid
    // For now, we'll assume the state is passed correctly or extracted earlier
    // (Decryption logic here depends on how encrypt() is implemented)
    // We'll pass the state to the controller to decode and then call the exchange method
  }

  async exchangeToken(platform: string, code: string, customerId: string) {
    switch (platform.toLowerCase()) {
      case 'github':
        return this.exchangeGitHubToken(code, customerId);
      case 'slack':
        return this.exchangeSlackToken(code, customerId);
      case 'jira':
        return this.exchangeJiraToken(code, customerId);
      case 'okta':
        return this.exchangeOktaToken(code, customerId);
      default:
        throw new BadRequestException(`Unsupported platform: ${platform}`);
    }
  }

  private async exchangeOktaToken(code: string, customerId: string) {
    const oktaDomain = this.configService.get('OKTA_DOMAIN');
    const response = await axios.post(
      `https://${oktaDomain}/oauth2/v1/token`,
      new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.configService.get('OKTA_CLIENT_ID') || '',
        client_secret: this.configService.get('OKTA_CLIENT_SECRET') || '',
        code,
        redirect_uri: this.getRedirectUri('okta'),
      }),
    );

    const { access_token } = response.data;
    if (!access_token)
      throw new BadRequestException('Failed to exchange Okta token');

    return this.integrationsService.connect(customerId, IntegrationType.OKTA, {
      token: access_token,
      orgUrl: `https://${oktaDomain}`,
      isOAuth: true,
    });
  }

  private async exchangeGitHubToken(code: string, customerId: string) {
    const response = await axios.post(
      'https://github.com/login/oauth/access_token',
      {
        client_id: this.configService.get('GITHUB_CLIENT_ID'),
        client_secret: this.configService.get('GITHUB_CLIENT_SECRET'),
        code,
        redirect_uri: this.getRedirectUri('github'),
      },
      { headers: { Accept: 'application/json' } },
    );

    const { access_token } = response.data;
    if (!access_token)
      throw new BadRequestException('Failed to exchange GitHub token');

    // Fetch user info to get the owner name
    const userRes = await axios.get('https://api.github.com/user', {
      headers: { Authorization: `token ${access_token}` },
    });

    const owner = userRes.data.login;
    console.log(
      `[OAuthService] Connecting GitHub for customer ${customerId}, owner: ${owner}`,
    );

    await this.integrationsService.connect(customerId, IntegrationType.GITHUB, {
      personalAccessToken: access_token,
      owner,
      repos: [], // Start with empty repos, user will select later
      isOAuth: true,
    });

    console.log(
      `[OAuthService] Successfully connected GitHub for ${customerId}`,
    );
    return { setupRequired: true };
  }

  private async exchangeSlackToken(code: string, customerId: string) {
    const response = await axios.post(
      'https://slack.com/api/oauth.v2.access',
      new URLSearchParams({
        client_id: this.configService.get('SLACK_CLIENT_ID') || '',
        client_secret: this.configService.get('SLACK_CLIENT_SECRET') || '',
        code,
        redirect_uri: this.getRedirectUri('slack'),
      }),
    );

    if (!response.data.ok)
      throw new BadRequestException(`Slack error: ${response.data.error}`);

    return this.integrationsService.connect(customerId, IntegrationType.SLACK, {
      token: response.data.access_token,
      webhookUrl: response.data.incoming_webhook?.url,
      teamId: response.data.team?.id,
      isOAuth: true,
    });
  }

  private async exchangeJiraToken(code: string, customerId: string) {
    const response = await axios.post(
      'https://auth.atlassian.com/oauth/token',
      {
        grant_type: 'authorization_code',
        client_id: this.configService.get('JIRA_CLIENT_ID'),
        client_secret: this.configService.get('JIRA_CLIENT_SECRET'),
        code,
        redirect_uri: this.getRedirectUri('jira'),
      },
    );

    const { access_token, refresh_token } = response.data;

    // For Jira, we also need the cloudId
    const accessibleResources = await axios.get(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      {
        headers: { Authorization: `Bearer ${access_token}` },
      },
    );

    const cloudId = accessibleResources.data[0]?.id;

    return this.integrationsService.connect(customerId, IntegrationType.JIRA, {
      apiToken: access_token,
      refreshToken: refresh_token,
      cloudId,
      email: 'oauth-user', // Placeholder
      domain: accessibleResources.data[0]?.url,
      isOAuth: true,
    });
  }
}
