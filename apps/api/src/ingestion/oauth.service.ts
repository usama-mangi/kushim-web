import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async getAuthUrl(provider: string, userId: string): Promise<string> {
    const state = await this.generateState(userId);
    
    switch (provider) {
      case 'github':
        return this.getGithubAuthUrl(state);
      case 'jira':
        return this.getJiraAuthUrl(state);
      case 'slack':
        return this.getSlackAuthUrl(state);
      case 'google':
        return this.getGoogleAuthUrl(state);
      default:
        throw new BadRequestException('Unsupported provider');
    }
  }

  async handleCallback(provider: string, code: string, state: string): Promise<any> {
    const userId = await this.validateState(state);
    let credentials: any;

    switch (provider) {
      case 'github':
        credentials = await this.exchangeGithubToken(code);
        break;
      case 'jira':
        credentials = await this.exchangeJiraToken(code);
        break;
      case 'slack':
        credentials = await this.exchangeSlackToken(code);
        break;
      case 'google':
        credentials = await this.exchangeGoogleToken(code);
        break;
      default:
        throw new BadRequestException('Unsupported provider');
    }

    const encryptedCredentials = await this.encryptionService.encryptObject(credentials);

    // Upsert DataSource
    const dataSource = await this.prisma.dataSource.create({
      data: {
        userId,
        providerName: provider,
        credentialsEncrypted: encryptedCredentials,
        status: 'active',
      },
    });

    return dataSource;
  }

  private async generateState(userId: string): Promise<string> {
    const payload = JSON.stringify({ userId, nonce: uuidv4() });
    return this.encryptionService.encrypt(payload);
  }

  private async validateState(state: string): Promise<string> {
    try {
      const decrypted = await this.encryptionService.decrypt(state);
      const payload = JSON.parse(decrypted);
      if (!payload.userId) throw new Error('Invalid state payload');
      return payload.userId;
    } catch (e) {
      throw new BadRequestException('Invalid OAuth state');
    }
  }

  private getGithubAuthUrl(state: string): string {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) throw new Error('GITHUB_CLIENT_ID not configured');
    
    const redirectUri = process.env.GITHUB_CALLBACK_URL || 'http://localhost:3001/api/ingestion/oauth/github/callback';
    const scopes = ['repo', 'user:email'];

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        scope: scopes.join(' '),
        state: state
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  private getJiraAuthUrl(state: string): string {
    const clientId = process.env.JIRA_CLIENT_ID;
    if (!clientId) throw new Error('JIRA_CLIENT_ID not configured');
    
    const redirectUri = process.env.JIRA_CALLBACK_URL || 'http://localhost:3001/api/ingestion/oauth/jira/callback';
    const scopes = ['read:jira-work', 'read:jira-user', 'offline_access'];

    const params = new URLSearchParams({
        audience: 'api.atlassian.com',
        client_id: clientId,
        scope: scopes.join(' '), 
        redirect_uri: redirectUri,
        state: state,
        response_type: 'code',
        prompt: 'consent'
    });

    // Atlassian can be strict about %20 vs + for spaces in scopes
    const query = params.toString().replace(/\+/g, '%20');

    return `https://auth.atlassian.com/authorize?${query}`;
  }

  private getSlackAuthUrl(state: string): string {
    const clientId = process.env.SLACK_CLIENT_ID;
    if (!clientId) throw new Error('SLACK_CLIENT_ID not configured');
    
    const redirectUri = process.env.SLACK_CALLBACK_URL || 'http://localhost:3001/api/ingestion/oauth/slack/callback';
    
    // Slack OAuth v2 requires user_scope for user-level permissions
    // These are the scopes needed to read user's messages, files, etc.
    const userScopes = [
      'channels:history',
      'channels:read',
      'files:read',
      'search:read',
      'users:read',
    ];

    const params = new URLSearchParams({
        client_id: clientId,
        user_scope: userScopes.join(','),
        redirect_uri: redirectUri,
        state: state
    });

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  private getGoogleAuthUrl(state: string): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/ingestion/oauth/google/callback';
    
    if (!clientId) throw new Error('GOOGLE_CLIENT_ID not configured');

    const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/gmail.readonly',
        'email',
        'profile'
    ];

    const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        state: state,
        access_type: 'offline',
        prompt: 'consent'
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private async exchangeGoogleToken(code: string): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/ingestion/oauth/google/callback';

    if (!clientId || !clientSecret) throw new Error('Google credentials not configured');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!response.ok) {
        const err = await response.text();
        this.logger.error(`Google Token Error: ${err}`);
        throw new Error('Failed to exchange Google token');
    }

    const tokenData = await response.json();
    
    return {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      token_type: tokenData.token_type,
    };
  }

  private async exchangeGithubToken(code: string): Promise<any> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) throw new Error('GitHub credentials not configured');

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange GitHub token');
    }

    const data = await response.json();
    if (data.error) throw new Error(data.error_description || 'GitHub OAuth Error');
    
    return { 
      token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_in ? Date.now() + (data.expires_in * 1000) : null,
      token_type: data.token_type,
    };
  }

  private async exchangeJiraToken(code: string): Promise<any> {
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_CLIENT_SECRET;
    const redirectUri = process.env.JIRA_CALLBACK_URL || 'http://localhost:3001/api/ingestion/oauth/jira/callback';

    if (!clientId || !clientSecret) throw new Error('Jira credentials not configured');

    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
        const err = await response.text();
        this.logger.error(`Jira Token Error: ${err}`);
        throw new Error('Failed to exchange Jira token');
    }

    const tokenData = await response.json();

    // Fetch accessible resources to get cloudId
    const resourcesResponse = await fetch('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!resourcesResponse.ok) {
      throw new Error('Failed to fetch Jira accessible resources');
    }

    const resources = await resourcesResponse.json();
    this.logger.log(`Jira Accessible Resources: ${JSON.stringify(resources)}`);

    if (resources.length === 0) {
      throw new Error('No Jira resources accessible');
    }

    // Use the first resource (site)
    // In a real app, we might ask the user to select one if multiple exist
    const site = resources[0];
    
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
      host: `https://api.atlassian.com/ex/jira/${site.id}`,
      cloudId: site.id,
      siteName: site.name,
    };
  }

  private async exchangeSlackToken(code: string): Promise<any> {
    const clientId = process.env.SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri = process.env.SLACK_CALLBACK_URL || 'http://localhost:3001/api/ingestion/oauth/slack/callback';

    if (!clientId || !clientSecret) throw new Error('Slack credentials not configured');

    // Slack uses x-www-form-urlencoded usually, but supports JSON in v2
    const form = new URLSearchParams();
    form.append('code', code);
    form.append('client_id', clientId);
    form.append('client_secret', clientSecret);
    form.append('redirect_uri', redirectUri);

    const response = await fetch('https://slack.com/api/oauth.v2.access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form,
    });

    const data: any = await response.json();
    if (!data.ok) {
      throw new Error(data.error || 'Slack OAuth Error');
    }

    // Slack OAuth v2 returns both bot and user tokens
    // For user_scope permissions, we need the user token
    // Note: Slack tokens don't expire, so no expires_at needed
    return { 
      token: data.authed_user?.access_token || data.access_token,
      team: data.team,
      authed_user: data.authed_user,
      bot_token: data.access_token, // Bot token (if bot scopes were requested)
    };
  }

  /**
   * Refresh OAuth access token for providers that support it
   */
  async refreshAccessToken(provider: string, refreshToken: string): Promise<any> {
    switch (provider) {
      case 'jira':
        return this.refreshJiraToken(refreshToken);
      case 'google':
        return this.refreshGoogleToken(refreshToken);
      case 'github':
        return this.refreshGithubToken(refreshToken);
      default:
        throw new BadRequestException(`Token refresh not supported for ${provider}`);
    }
  }

  private async refreshGithubToken(refreshToken: string): Promise<any> {
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    if (!clientId || !clientSecret) throw new Error('GitHub credentials not configured');

    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`GitHub Token Refresh Error: ${err}`);
      throw new Error('Failed to refresh GitHub token');
    }

    const tokenData = await response.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || 'GitHub token refresh failed');
    }

    return {
      token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || refreshToken,
      expires_at: tokenData.expires_in ? Date.now() + (tokenData.expires_in * 1000) : null,
    };
  }

  private async refreshJiraToken(refreshToken: string): Promise<any> {
    const clientId = process.env.JIRA_CLIENT_ID;
    const clientSecret = process.env.JIRA_CLIENT_SECRET;

    if (!clientId || !clientSecret) throw new Error('Jira credentials not configured');

    const response = await fetch('https://auth.atlassian.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Jira Token Refresh Error: ${err}`);
      throw new Error('Failed to refresh Jira token');
    }

    const tokenData = await response.json();
    return {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || refreshToken,
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };
  }

  private async refreshGoogleToken(refreshToken: string): Promise<any> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) throw new Error('Google credentials not configured');

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Google Token Refresh Error: ${err}`);
      throw new Error('Failed to refresh Google token');
    }

    const tokenData = await response.json();
    return {
      access_token: tokenData.access_token,
      refresh_token: refreshToken, // Google may not return a new refresh token
      expires_at: Date.now() + (tokenData.expires_in * 1000),
    };
  }
}
