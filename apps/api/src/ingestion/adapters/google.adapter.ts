import { BaseAdapter } from './base.adapter';
import { createHash } from 'crypto';
import { google } from 'googleapis';
import { KushimStandardRecord, ArtifactType } from '../../common/ksr.interface';
import { v4 as uuidv4 } from 'uuid';

export class GoogleAdapter extends BaseAdapter {
  name = 'google';

  async fetch(credentials: any, lastSync?: Date): Promise<any[]> {
    if (!credentials?.refresh_token && !credentials?.access_token) {
      throw new Error('Google credentials (access_token or refresh_token) required');
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

    // 1. Fetch Drive Files (Docs)
    try {
      const drive = google.drive({ version: 'v3', auth });
      let query = "mimeType = 'application/vnd.google-apps.document' and trashed = false";
      if (lastSync) {
        query += ` and modifiedTime > '${lastSync.toISOString()}'`;
      }
      
      const driveRes = await drive.files.list({
        q: query,
        pageSize: 50,
        fields: 'files(id, name, webViewLink, iconLink, modifiedTime, owners)',
      });
      
      if (driveRes.data.files) {
        results.push(...driveRes.data.files.map(f => ({ ...f, _type: 'drive' })));
      }
    } catch (e) {
      console.error('Google Drive Fetch Error:', e);
    }

    // 2. Fetch Gmail (Emails)
    try {
      const gmail = google.gmail({ version: 'v1', auth });
      let q = '';
      if (lastSync) {
        // Gmail query: after:YYYY/MM/DD
        const dateStr = lastSync.toISOString().split('T')[0].replace(/-/g, '/');
        q = `after:${dateStr}`;
      }

      const msgs = await gmail.users.messages.list({
        userId: 'me',
        q,
        maxResults: 50,
      });

      if (msgs.data.messages) {
        for (const msgRef of msgs.data.messages) {
            if (!msgRef.id) continue;
            const msg = await gmail.users.messages.get({
                userId: 'me',
                id: msgRef.id,
                format: 'full', // need snippet and headers
            });
            results.push({ ...msg.data, _type: 'gmail' });
        }
      }
    } catch (e) {
      console.error('Gmail Fetch Error:', e);
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
      externalId: file.id,
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
    const date = headers.find((h: any) => h.name === 'Date')?.value;

    return {
        externalId: msg.id,
        sourcePlatform: 'google',
        artifactType: ArtifactType.EMAIL,
        title: subject,
        body: msg.snippet || '',
        url: `https://mail.google.com/mail/u/0/#inbox/${msg.id}`,
        author: from,
        timestamp: date ? new Date(date) : new Date(parseInt(msg.internalDate)),
        participants: [from, ...to.split(',').map((e: string) => e.trim())],
        metadata: {
            threadId: msg.threadId,
            labels: msg.labelIds
        }
    };
  }
}
