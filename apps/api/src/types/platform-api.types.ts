/**
 * Platform API Response Types
 * Type definitions for external platform API responses
 */

/**
 * GitHub API Types
 */
export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  name: string | null;
  email: string | null;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  owner: GitHubUser;
  private: boolean;
  html_url: string;
  description: string | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  labels: Array<{ id: number; name: string; color: string }>;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
  merged: boolean;
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  html_url: string;
  author: GitHubUser | null;
}

/**
 * Slack API Types
 */
export interface SlackUser {
  id: string;
  name: string;
  real_name: string;
  profile: {
    email?: string;
    display_name: string;
    image_72: string;
  };
}

export interface SlackChannel {
  id: string;
  name: string;
  is_private: boolean;
  is_archived: boolean;
  creator: string;
  created: number;
}

export interface SlackMessage {
  type: 'message';
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  channel: string;
  client_msg_id?: string;
}

/**
 * Jira API Types
 */
export interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls: {
    '48x48': string;
  };
}

export interface JiraIssue {
  id: string;
  key: string;
  self: string;
  fields: {
    summary: string;
    description: string | null;
    status: {
      name: string;
      statusCategory: {
        key: string;
      };
    };
    priority: {
      name: string;
    } | null;
    creator: JiraUser;
    assignee: JiraUser | null;
    created: string;
    updated: string;
    labels: string[];
  };
}

export interface JiraComment {
  id: string;
  self: string;
  body: string;
  author: JiraUser;
  created: string;
  updated: string;
}

/**
 * Google API Types
 */
export interface GoogleUser {
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}

export interface GoogleDriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  modifiedTime: string;
  owners: Array<{
    displayName: string;
    emailAddress: string;
  }>;
  webViewLink: string;
  iconLink: string;
}

export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    email: string;
    displayName?: string;
  }>;
  htmlLink: string;
}

export interface GmailMessage {
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;
  payload: {
    headers: Array<{
      name: string;
      value: string;
    }>;
    body: {
      data?: string;
    };
    parts?: Array<{
      mimeType: string;
      body: {
        data?: string;
      };
    }>;
  };
  internalDate: string;
}

/**
 * Unified Platform Response
 */
export type PlatformAPIResponse =
  | GitHubIssue
  | GitHubPullRequest
  | GitHubCommit
  | SlackMessage
  | JiraIssue
  | JiraComment
  | GoogleDriveFile
  | GoogleCalendarEvent
  | GmailMessage;
