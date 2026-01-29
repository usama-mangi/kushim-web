/**
 * OAuth Credentials Types
 * Platform-specific credential structures
 */

export interface BaseOAuthCredentials {
  access_token: string;
  token_type: string;
  expires_at?: number;
  scope?: string;
}

export interface GitHubOAuthCredentials extends BaseOAuthCredentials {
  refresh_token?: string;
  refresh_token_expires_at?: number;
}

export interface GoogleOAuthCredentials extends BaseOAuthCredentials {
  refresh_token: string;
  id_token?: string;
  expiry_date?: number;
}

export interface SlackOAuthCredentials extends BaseOAuthCredentials {
  team_id: string;
  team_name?: string;
  authed_user?: {
    id: string;
    access_token?: string;
  };
  bot_user_id?: string;
  app_id?: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface JiraOAuthCredentials extends BaseOAuthCredentials {
  refresh_token: string;
  cloud_id?: string;
  resource_url?: string;
}

export type PlatformCredentials =
  | GitHubOAuthCredentials
  | GoogleOAuthCredentials
  | SlackOAuthCredentials
  | JiraOAuthCredentials;

/**
 * Type guard functions
 */
export function isGitHubCredentials(
  creds: PlatformCredentials,
): creds is GitHubOAuthCredentials {
  return 'access_token' in creds;
}

export function isGoogleCredentials(
  creds: PlatformCredentials,
): creds is GoogleOAuthCredentials {
  return 'refresh_token' in creds && 'id_token' in creds;
}

export function isSlackCredentials(
  creds: PlatformCredentials,
): creds is SlackOAuthCredentials {
  return 'team_id' in creds;
}

export function isJiraCredentials(
  creds: PlatformCredentials,
): creds is JiraOAuthCredentials {
  return 'refresh_token' in creds && 'cloud_id' in creds;
}
