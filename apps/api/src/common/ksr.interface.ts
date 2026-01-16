export enum ArtifactType {
  ISSUE = 'issue',
  PULL_REQUEST = 'pull_request',
  TASK = 'task',
  MESSAGE = 'message',
  DOCUMENT = 'document',
  EMAIL = 'email',
  COMMIT = 'commit',
}

export interface KushimStandardRecord {
  id: string; // Internal UUID
  externalId: string; // ID in the source system
  sourcePlatform: string; // 'github', 'jira', 'slack', etc.
  artifactType: ArtifactType;
  title: string;
  body: string;
  url: string;
  author: string; // Main author/assignee
  timestamp: Date;
  participants: string[]; // List of users involved
  metadata: Record<string, any>; // Platform-specific fields
  checksum: string; // For deduplication
}
