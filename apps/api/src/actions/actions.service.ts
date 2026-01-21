import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { Octokit } from 'octokit';
import { RelationshipService } from '../records/relationship.service';
import { WebClient } from '@slack/web-api';
import { Version3Client } from 'jira.js';
import { google } from 'googleapis';

export enum ActionVerb {
  COMMENT = 'comment',
  ASSIGN = 'assign',
  REPLY = 'reply',
  CLOSE = 'close',
  LINK = 'link',
  REACT = 'react',
}

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private relationshipService: RelationshipService,
  ) {}

  async executeCommand(userId: string, command: string) {
    const parts = command.trim().split(/\s+/);
    const verb = parts[0]?.toLowerCase() as ActionVerb;
    
    if (!verb) {
      throw new BadRequestException('Command cannot be empty');
    }

    if (!Object.values(ActionVerb).includes(verb)) {
      throw new BadRequestException(`Unknown action verb: ${verb}. Supported: ${Object.values(ActionVerb).join(', ')}`);
    }

    this.logger.log(`Executing command: ${verb} | Full command: ${command}`);

    // Handle LINK command (requires two targets)
    if (verb === ActionVerb.LINK) {
      const targetQuery1 = parts[1];
      const targetQuery2 = parts[2];
      
      if (!targetQuery1 || !targetQuery2) {
        throw new BadRequestException('Link command requires two targets: link [id1] [id2]');
      }

      const recordA = await this.findRecord(userId, targetQuery1);
      const recordB = await this.findRecord(userId, targetQuery2);

      await this.relationshipService.createManualLink(userId, recordA.id, recordB.id);
      
      return {
        success: true,
        message: `Successfully linked "${recordA.title}" and "${recordB.title}"`,
        recordId: recordA.id,
      };
    }

    // All other commands require at least 2 parts
    const targetQuery = parts[1];
    if (!targetQuery) {
      throw new BadRequestException(`${verb} command requires a target`);
    }

    const payload = parts.slice(2).join(' ');

    const record = await this.findRecord(userId, targetQuery);
    
    let credentials: any = record.source.credentialsEncrypted;
    if (credentials && typeof credentials === 'object' && '_encrypted' in credentials) {
      credentials = await this.encryptionService.decryptObject(credentials);
    }

    if (!credentials) {
      throw new BadRequestException('Source credentials not found. Please reconnect this platform.');
    }

    const metadata = record.metadata as any;
    if (!metadata) {
      throw new BadRequestException('Record metadata not found');
    }

    const platform = record.sourcePlatform.toLowerCase();

    // Route to platform-specific handlers
    switch (platform) {
      case 'github':
        return await this.executeGitHubAction(verb, record, credentials, metadata, payload);
      case 'jira':
        return await this.executeJiraAction(verb, record, credentials, metadata, payload);
      case 'slack':
        return await this.executeSlackAction(verb, record, credentials, metadata, payload);
      case 'google':
        return await this.executeGoogleAction(verb, record, credentials, metadata, payload);
      default:
        throw new BadRequestException(`Platform "${platform}" does not support action execution`);
    }
  }

  private async findRecord(userId: string, query: string) {
    // Parse optional platform-specific prefixes
    const prefixPatterns = {
      github: /^(?:GH-(?:ISSUE-|PR-)?|GITHUB-)(\d+)$/i,
      jira: /^([A-Z]+-\d+)$/,  // Already has natural prefix like PROJ-123
      slack: /^(?:SLACK-)(.+)$/i,
      gmail: /^(?:GMAIL-|EMAIL-)(.+)$/i,
      gdoc: /^(?:GDOC-|DOC-)(.+)$/i,
      google: /^(?:GOOGLE-|GDRIVE-)(.+)$/i,
    };

    let platform: string | null = null;
    let cleanId: string = query;

    // Check for platform-specific prefix
    for (const [platformKey, pattern] of Object.entries(prefixPatterns)) {
      const match = query.match(pattern);
      if (match) {
        platform = platformKey === 'gmail' || platformKey === 'gdoc' ? 'google' : platformKey;
        cleanId = match[1];
        break;
      }
    }

    // Build search criteria - search by externalId
    // Note: externalId now stores prefixed IDs (e.g., "GH-123", "SLACK-abc", "PROJ-456")
    const searchConditions: any[] = [];

    // Try exact match with the query as-is (handles prefixed input like "GH-13")
    searchConditions.push({ externalId: query });

    // If we detected a platform, also try the standardized prefixed format
    if (platform && cleanId) {
      const prefixMap: Record<string, string> = {
        github: 'GH-',
        jira: '', // Jira already has natural prefix
        slack: 'SLACK-',
        google: query.match(/^(?:GMAIL-|EMAIL-)/i) ? 'EMAIL-' : 'GDOC-',
      };
      
      const prefix = prefixMap[platform] || '';
      const standardId = prefix ? `${prefix}${cleanId}` : cleanId;
      if (standardId !== query) {
        searchConditions.push({ externalId: standardId });
      }
    }
    
    // If no prefix detected and query is just a number, try with common prefixes
    if (!platform && /^\d+$/.test(query)) {
      searchConditions.push({ externalId: `GH-${query}` });
    }
    
    // Fallback: partial match for flexibility
    searchConditions.push({ externalId: { contains: query, mode: 'insensitive' } });
    
    // Finally, fallback to title search
    searchConditions.push({ title: { contains: query, mode: 'insensitive' } });

    const record = await this.prisma.unifiedRecord.findFirst({
      where: {
        userId,
        OR: searchConditions,
      },
      include: { source: true },
      orderBy: { timestamp: 'desc' }, // Prefer most recent match
    });

    if (!record) {
      throw new BadRequestException(
        `Target record "${query}" not found. Check the artifact ID or title.`
      );
    }
    
    return record;
  }

  // ==================== GITHUB ACTIONS ====================

  private async executeGitHubAction(
    verb: ActionVerb,
    record: any,
    credentials: any,
    metadata: any,
    payload: string,
  ) {
    const token = credentials.token as string;
    if (!token) throw new BadRequestException('GitHub token not found in credentials');

    const octokit = new Octokit({ auth: token });
    const repoPath = metadata['repository'] as string;
    if (!repoPath) throw new BadRequestException('Repository path not found in metadata');

    const [owner, repo] = repoPath.split('/');
    const issueNumber = metadata['number'] as number;
    if (!issueNumber) throw new BadRequestException('Issue number not found in metadata');

    switch (verb) {
      case ActionVerb.COMMENT:
        if (!payload) throw new BadRequestException('Comment text is required');
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: issueNumber,
          body: payload,
        });
        return {
          success: true,
          message: `Comment posted to GitHub ${metadata['type'] || 'issue'} #${issueNumber}`,
          recordId: record.id,
        };

      case ActionVerb.ASSIGN:
        if (!payload) throw new BadRequestException('Assignee username is required');
        const assignees = payload.replace(/@/g, '').split(/[\s,]+/).filter(Boolean);
        await octokit.rest.issues.addAssignees({
          owner,
          repo,
          issue_number: issueNumber,
          assignees,
        });
        return {
          success: true,
          message: `Assigned ${assignees.join(', ')} to GitHub ${metadata['type'] || 'issue'} #${issueNumber}`,
          recordId: record.id,
        };

      case ActionVerb.CLOSE:
        await octokit.rest.issues.update({
          owner,
          repo,
          issue_number: issueNumber,
          state: 'closed',
        });
        return {
          success: true,
          message: `Closed GitHub ${metadata['type'] || 'issue'} #${issueNumber}`,
          recordId: record.id,
        };

      default:
        throw new BadRequestException(`Action "${verb}" not supported for GitHub`);
    }
  }

  // ==================== JIRA ACTIONS ====================

  private async executeJiraAction(
    verb: ActionVerb,
    record: any,
    credentials: any,
    metadata: any,
    payload: string,
  ) {
    const { host, email, token } = credentials;
    if (!host || !email || !token) {
      throw new BadRequestException('Jira credentials incomplete');
    }

    const jiraClient = new Version3Client({
      host,
      authentication: {
        basic: {
          email,
          apiToken: token,
        },
      },
    });

    const issueKey = metadata['key'] || record.externalId;
    if (!issueKey) throw new BadRequestException('Jira issue key not found');

    switch (verb) {
      case ActionVerb.COMMENT:
        if (!payload) throw new BadRequestException('Comment text is required');
        await jiraClient.issueComments.addComment({
          issueIdOrKey: issueKey,
          comment: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: payload,
                  },
                ],
              },
            ],
          },
        });
        return {
          success: true,
          message: `Comment posted to Jira issue ${issueKey}`,
          recordId: record.id,
        };

      case ActionVerb.ASSIGN:
        if (!payload) throw new BadRequestException('Assignee account ID or email is required');
        await jiraClient.issues.assignIssue({
          issueIdOrKey: issueKey,
          accountId: payload.trim(),
        });
        return {
          success: true,
          message: `Assigned ${payload} to Jira issue ${issueKey}`,
          recordId: record.id,
        };

      case ActionVerb.CLOSE:
        // Find available transitions
        const transitions = await jiraClient.issues.getTransitions({
          issueIdOrKey: issueKey,
        });
        
        // Look for "Done", "Closed", or similar transition
        const closeTransition = transitions.transitions?.find(
          (t) => t.name?.toLowerCase().includes('done') || 
                 t.name?.toLowerCase().includes('close')
        );

        if (!closeTransition) {
          throw new BadRequestException('No "Done" or "Close" transition found for this Jira issue');
        }

        await jiraClient.issues.doTransition({
          issueIdOrKey: issueKey,
          transition: {
            id: closeTransition.id,
          },
        });

        return {
          success: true,
          message: `Transitioned Jira issue ${issueKey} to ${closeTransition.name}`,
          recordId: record.id,
        };

      default:
        throw new BadRequestException(`Action "${verb}" not supported for Jira`);
    }
  }

  // ==================== SLACK ACTIONS ====================

  private async executeSlackAction(
    verb: ActionVerb,
    record: any,
    credentials: any,
    metadata: any,
    payload: string,
  ) {
    const token = credentials.accessToken || credentials.token;
    if (!token) throw new BadRequestException('Slack token not found in credentials');

    const slackClient = new WebClient(token);
    const channel = metadata['channel'] || metadata['channelId'];
    const ts = metadata['ts'] || metadata['timestamp'];

    if (!channel) throw new BadRequestException('Slack channel not found in metadata');

    switch (verb) {
      case ActionVerb.REPLY:
        if (!payload) throw new BadRequestException('Reply text is required');
        if (!ts) throw new BadRequestException('Message timestamp not found - cannot reply to thread');
        
        await slackClient.chat.postMessage({
          channel,
          thread_ts: ts,
          text: payload,
        });

        return {
          success: true,
          message: `Reply posted to Slack thread in #${channel}`,
          recordId: record.id,
        };

      case ActionVerb.REACT:
        if (!payload) throw new BadRequestException('Reaction emoji name is required (e.g., "thumbsup")');
        if (!ts) throw new BadRequestException('Message timestamp not found');

        const emoji = payload.replace(/:/g, '').trim();
        await slackClient.reactions.add({
          channel,
          timestamp: ts,
          name: emoji,
        });

        return {
          success: true,
          message: `Reacted with :${emoji}: to Slack message`,
          recordId: record.id,
        };

      case ActionVerb.COMMENT:
        // Treat comment as a threaded reply for Slack
        if (!payload) throw new BadRequestException('Comment text is required');
        
        const messageTs = ts || undefined;
        await slackClient.chat.postMessage({
          channel,
          thread_ts: messageTs,
          text: payload,
        });

        return {
          success: true,
          message: messageTs 
            ? `Comment posted to Slack thread in #${channel}`
            : `Message posted to Slack channel #${channel}`,
          recordId: record.id,
        };

      default:
        throw new BadRequestException(`Action "${verb}" not supported for Slack`);
    }
  }

  // ==================== GOOGLE WORKSPACE ACTIONS ====================

  private async executeGoogleAction(
    verb: ActionVerb,
    record: any,
    credentials: any,
    metadata: any,
    payload: string,
  ) {
    const { access_token, refresh_token } = credentials;
    if (!access_token) throw new BadRequestException('Google access token not found');

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    oauth2Client.setCredentials({
      access_token,
      refresh_token,
    });

    const recordType = metadata['type'] || record.recordType;

    // Handle Gmail messages
    if (recordType === 'email' || recordType === 'gmail_message') {
      return await this.executeGmailAction(verb, record, oauth2Client, metadata, payload);
    }

    // Handle Google Docs
    if (recordType === 'document' || recordType === 'google_doc') {
      return await this.executeGoogleDocsAction(verb, record, oauth2Client, metadata, payload);
    }

    throw new BadRequestException(`Google action not supported for record type: ${recordType}`);
  }

  private async executeGmailAction(
    verb: ActionVerb,
    record: any,
    oauth2Client: any,
    metadata: any,
    payload: string,
  ) {
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    const messageId = metadata['messageId'] || metadata['id'];
    const threadId = metadata['threadId'];

    switch (verb) {
      case ActionVerb.REPLY:
        if (!payload) throw new BadRequestException('Reply text is required');
        if (!threadId) throw new BadRequestException('Thread ID not found - cannot reply');

        const emailLines = [
          `To: ${metadata['from']}`,
          `Subject: Re: ${metadata['subject'] || '(no subject)'}`,
          'Content-Type: text/plain; charset=utf-8',
          '',
          payload,
        ];

        const emailMessage = emailLines.join('\n');
        const encodedMessage = Buffer.from(emailMessage).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

        await gmail.users.messages.send({
          userId: 'me',
          requestBody: {
            raw: encodedMessage,
            threadId,
          },
        });

        return {
          success: true,
          message: `Reply sent to email thread`,
          recordId: record.id,
        };

      default:
        throw new BadRequestException(`Action "${verb}" not supported for Gmail`);
    }
  }

  private async executeGoogleDocsAction(
    verb: ActionVerb,
    record: any,
    oauth2Client: any,
    metadata: any,
    payload: string,
  ) {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    const documentId = metadata['documentId'] || metadata['id'];

    if (!documentId) throw new BadRequestException('Google Doc ID not found');

    switch (verb) {
      case ActionVerb.COMMENT:
        if (!payload) throw new BadRequestException('Comment text is required');
        
        const drive = google.drive({ version: 'v3', auth: oauth2Client });
        
        await drive.comments.create({
          fileId: documentId,
          requestBody: {
            content: payload,
          },
        });

        return {
          success: true,
          message: `Comment added to Google Doc`,
          recordId: record.id,
        };

      default:
        throw new BadRequestException(`Action "${verb}" not supported for Google Docs`);
    }
  }
}
