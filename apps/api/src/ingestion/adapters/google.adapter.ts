import { BaseAdapter } from './base.adapter';
import { createHash } from 'crypto';
import { google } from 'googleapis';
import { KushimStandardRecord, ArtifactType } from '../../common/ksr.interface';
import { GoogleCredentials, isGoogleCredentials } from '../../common/oauth-credentials.types';
import { v4 as uuidv4 } from 'uuid';

export class GoogleAdapter extends BaseAdapter {
  name = 'google';
  private readonly MAX_EMAILS = 1000; // Safety limit
  private readonly MAX_DRIVE_FILES = 1000; // Safety limit

  constructor() {
    super();
  }

  /**
   * Extract email body from Gmail message payload
   * Gmail API returns body in parts - need to decode base64
   */
  private extractEmailBody(payload: any): string {
    if (!payload) return '';

    // Try to get plain text body
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }

    // Check parts (multipart email)
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }

      // Fall back to HTML if no plain text
      for (const part of payload.parts) {
        if (part.mimeType === 'text/html' && part.body?.data) {
          const html = Buffer.from(part.body.data, 'base64').toString('utf-8');
          // Simple HTML stripping (basic - for better results use a library)
          return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
      }
    }

    return '';
  }

  async fetch(credentials: GoogleCredentials, lastSync?: Date): Promise<any[]> {
    if (!isGoogleCredentials(credentials)) {
      throw new Error('Invalid Google credentials format');
    }

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );

    auth.setCredentials({
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token,
    });

    // Handle token refresh if needed is automatic with googleapis if refresh_token is present
    
    const results: any[] = [];

    // 1. Fetch Drive Files (Docs) with pagination
    try {
      const drive = google.drive({ version: 'v3', auth });
      let query = "mimeType = 'application/vnd.google-apps.document' and trashed = false";
      if (lastSync) {
        query += ` and modifiedTime > '${lastSync.toISOString()}'`;
      }
      
      let pageToken: string | undefined;
      let totalFetched = 0;
      const maxPages = 20; // Limit to prevent runaway pagination (1000 files max)
      let currentPage = 0;

      do {
        const driveRes = await drive.files.list({
          q: query,
          pageSize: 50,
          pageToken,
          fields: 'nextPageToken, files(id, name, webViewLink, iconLink, modifiedTime, owners)',
        });
        
        if (driveRes.data.files) {
          results.push(...driveRes.data.files.map(f => ({ ...f, _type: 'drive' })));
          totalFetched += driveRes.data.files.length;
        }

        pageToken = driveRes.data.nextPageToken || undefined;
        currentPage++;
      } while (pageToken && currentPage < maxPages);

      this.logger.log(`Fetched ${totalFetched} Google Drive documents`);
    } catch (e) {
      this.logger.error('Google Drive Fetch Error', e);
    }

    // 2. Fetch Gmail (Emails) with pagination
    try {
      const gmail = google.gmail({ version: 'v1', auth });
      let q = '-in:spam -in:trash'; // Exclude spam and trash
      if (lastSync) {
        // Gmail query: after:YYYY/MM/DD
        const dateStr = lastSync.toISOString().split('T')[0].replace(/-/g, '/');
        q += ` after:${dateStr}`;
      }

      let pageToken: string | undefined;
      let totalFetched = 0;
      const maxPages = 20; // Limit to prevent runaway pagination (1000 emails max)
      let currentPage = 0;

      do {
        const msgList = await gmail.users.messages.list({
          userId: 'me',
          q,
          maxResults: 50,
          pageToken,
        });

        if (msgList.data.messages) {
          // Fetch full message details in batches
          const messageIds = msgList.data.messages.map(m => m.id).filter(Boolean) as string[];
          
          // Batch fetch messages (Gmail API doesn't have true batch endpoint, so we do sequential)
          for (const msgId of messageIds) {
            try {
              const msg = await gmail.users.messages.get({
                userId: 'me',
                id: msgId,
                format: 'full', // Get headers and snippet
              });
              results.push({ ...msg.data, _type: 'gmail' });
              totalFetched++;
            } catch (err) {
              this.logger.warn(`Failed to fetch email ${msgId}`, err);
            }
          }
        }

        pageToken = msgList.data.nextPageToken || undefined;
        currentPage++;
      } while (pageToken && currentPage < maxPages);

      this.logger.log(`Fetched ${totalFetched} Gmail messages`);
    } catch (e) {
      this.logger.error('Gmail Fetch Error', e);
    }

    return results;
  }

  normalize(rawRecord: any): KushimStandardRecord {
    let payload: Omit<KushimStandardRecord, 'checksum' | 'id'>;

    if (rawRecord._type === 'drive') {
      payload = this.normalizeDrive(rawRecord);
    } else {
      payload = this.normalizeGmail(rawRecord);
    }

    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      id: uuidv4(),
      ...payload,
      checksum,
    };
  }

  private normalizeDrive(file: any): Omit<KushimStandardRecord, 'checksum' | 'id'> {
    return {
      externalId: `GDOC-${file.id}`,
      sourcePlatform: 'google',
      artifactType: ArtifactType.DOCUMENT,
      title: file.name,
      body: '', // Drive list API doesn't give content. Need export link for that, expensive for sync.
      url: file.webViewLink,
      author: file.owners?.[0]?.emailAddress || 'unknown',
      timestamp: new Date(file.modifiedTime),
      participants: (file.owners || []).map((o: any) => o.emailAddress),
      metadata: {
        mimeType: file.mimeType,
      },
    };
  }

  private normalizeGmail(msg: any): Omit<KushimStandardRecord, 'checksum' | 'id'> {
    const headers = msg.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === 'Subject')?.value || 'No Subject';
    const from = headers.find((h: any) => h.name === 'From')?.value || 'unknown';
    const to = headers.find((h: any) => h.name === 'To')?.value || '';
    const cc = headers.find((h: any) => h.name === 'Cc')?.value || '';
    const date = headers.find((h: any) => h.name === 'Date')?.value;
    const messageId = headers.find((h: any) => h.name === 'Message-ID')?.value || '';
    const inReplyTo = headers.find((h: any) => h.name === 'In-Reply-To')?.value || '';
    const references = headers.find((h: any) => h.name === 'References')?.value || '';

    // Extract email addresses from headers
    const extractEmails = (str: string): string[] => {
      if (!str) return [];
      const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
      const matches = str.match(emailRegex);
      return matches ? [...new Set(matches)] : [];
    };

    const toEmails = extractEmails(to);
    const ccEmails = extractEmails(cc);
    const fromEmail = extractEmails(from)[0] || 'unknown';
    const allParticipants = [fromEmail, ...toEmails, ...ccEmails].filter(Boolean);

    // Extract full email body (up to reasonable limit for performance)
    const fullBody = this.extractEmailBody(msg.payload);
    const bodyToStore = fullBody.length > 5000 
      ? fullBody.substring(0, 5000) + '...' 
      : fullBody || msg.snippet || '';

    // Extract links from email body
    const extractLinks = (text: string): string[] => {
      if (!text) return [];
      const urlRegex = /(https?:\/\/[^\s<>"']+)/gi;
      const matches = text.match(urlRegex);
      return matches ? [...new Set(matches)].slice(0, 50) : []; // Limit to 50 links
    };

    const links = extractLinks(fullBody || msg.snippet || '');

    // Build threading metadata
    const threadingInfo: any = {
      threadId: msg.threadId,
      messageId,
      inReplyTo,
      references: references.split(/\s+/).filter(Boolean),
      isThreadStart: !inReplyTo && !references,
    };

    return {
      externalId: `EMAIL-${msg.id}`,
      sourcePlatform: 'google',
      artifactType: ArtifactType.EMAIL,
      title: subject,
      body: bodyToStore,
      url: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
      author: fromEmail,
      timestamp: date ? new Date(date) : new Date(parseInt(msg.internalDate)),
      participants: allParticipants,
      metadata: {
        threadId: msg.threadId,
        labels: msg.labelIds || [],
        messageId,
        inReplyTo,
        references: threadingInfo.references,
        isThreadStart: threadingInfo.isThreadStart,
        extractedLinks: links, // Links found in email body
        hasAttachments: (msg.payload?.parts || []).some((p: any) => p.filename),
        sizeEstimate: msg.sizeEstimate || 0,
      },
    };
  }
}
