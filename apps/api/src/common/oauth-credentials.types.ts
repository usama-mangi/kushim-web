/**
 * OAuth Credentials Types
 * Platform-specific credential structures for OAuth integrations
 */

/**
 * Base OAuth credentials interface
 */
export interface BaseOAuthCredentials {
  expires_at?: number; // Unix timestamp when token expires
}

/**
 * GitHub OAuth credentials
 * Note: GitHub tokens don't expire by default, but can with refresh tokens
 */
export interface GitHubCredentials extends BaseOAuthCredentials {
  token: string;
  refresh_token?: string;
  token_type?: string;
}

/**
 * Google OAuth credentials (Gmail, Drive)
 */
export interface GoogleCredentials extends BaseOAuthCredentials {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

/**
 * Jira OAuth credentials (Atlassian)
 */
export interface JiraCredentials extends BaseOAuthCredentials {
  accessToken: string;
  refreshToken: string;
  host: string; // e.g., https://api.atlassian.com/ex/jira/{cloudId}
  cloudId: string;
  siteName: string;
}

/**
 * Slack OAuth credentials
 * Slack tokens don't expire, so no refresh_token needed
 */
export interface SlackCredentials {
  token: string; // User token
  team?: {
    id: string;
    name: string;
  };
  authed_user?: {
    id: string;
    access_token: string;
  };
  bot_token?: string; // Bot token if bot scopes requested
}

/**
 * Union type for all supported OAuth credentials
 */
export type PlatformCredentials =
  | GitHubCredentials
  | GoogleCredentials
  | JiraCredentials
  | SlackCredentials;

/**
 * Type guard to check if credentials are GitHub credentials
 */
export function isGitHubCredentials(creds: unknown): creds is GitHubCredentials {
  return (
    typeof creds === 'object' &&
    creds !== null &&
    'token' in creds &&
    typeof (creds as any).token === 'string'
  );
}

/**
 * Type guard to check if credentials are Google credentials
 */
export function isGoogleCredentials(creds: unknown): creds is GoogleCredentials {
  return (
    typeof creds === 'object' &&
    creds !== null &&
    'access_token' in creds &&
    'refresh_token' in creds &&
    typeof (creds as any).access_token === 'string' &&
    typeof (creds as any).refresh_token === 'string'
  );
}

/**
 * Type guard to check if credentials are Jira credentials
 */
export function isJiraCredentials(creds: unknown): creds is JiraCredentials {
  return (
    typeof creds === 'object' &&
    creds !== null &&
    'accessToken' in creds &&
    'refreshToken' in creds &&
    'host' in creds &&
    'cloudId' in creds &&
    typeof (creds as any).accessToken === 'string' &&
    typeof (creds as any).host === 'string'
  );
}

/**
 * Type guard to check if credentials are Slack credentials
 */
export function isSlackCredentials(creds: unknown): creds is SlackCredentials {
  return (
    typeof creds === 'object' &&
    creds !== null &&
    'token' in creds &&
    typeof (creds as any).token === 'string'
  );
}
