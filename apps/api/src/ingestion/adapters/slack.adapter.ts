import { BaseAdapter } from './base.adapter';
import { createHash } from 'crypto';
import { WebClient } from '@slack/web-api';
import { KushimStandardRecord, ArtifactType } from '../../common/ksr.interface';
import { v4 as uuidv4 } from 'uuid';

export class SlackAdapter extends BaseAdapter {
  name = 'slack';

  async fetch(credentials: any, lastSync?: Date): Promise<any[]> {
    if (!credentials?.token) {
      throw new Error('Slack User Token is required');
    }

    const client = new WebClient(credentials.token);

    try {
      // For messages, we'd ideally use search.messages or conversations.history
      // But for now, let's stick to stars.list as it represents intent
      // and try to get more history if requested.
      const result = await client.stars.list({ limit: 50 });
      let items = result.items || [];

      if (lastSync) {
        const lastSyncTs = (lastSync.getTime() / 1000).toString();
        items = items.filter((item: any) => {
          const ts = item.message?.ts || item.file?.created || 0;
          return parseFloat(ts) > parseFloat(lastSyncTs);
        });
      }

      return items;
    } catch (error) {
      console.error('Slack API Error:', error);
      throw new Error('Failed to fetch data from Slack');
    }
  }

  normalize(rawRecord: any): KushimStandardRecord {
    let title = 'Slack Item';
    let body = '';
    let url = '';
    let id = '';
    let author = 'unknown';
    let timestamp = new Date();
    let participants: string[] = [];

    if (rawRecord.type === 'message') {
      const msg = rawRecord.message;
      author = msg.user;
      body = msg.text || '';
      title = body.substring(0, 50) + (body.length > 50 ? '...' : '');
      url = `https://slack.com/archives/${rawRecord.channel}/p${msg.ts.replace('.', '')}`;
      id = msg.ts;
      timestamp = new Date(parseFloat(msg.ts) * 1000);
      participants = [msg.user];
    } else if (rawRecord.type === 'file') {
      const file = rawRecord.file;
      title = file.name;
      body = file.plaintext || file.url_private || '';
      author = file.user;
      url = file.permalink;
      id = file.id;
      timestamp = new Date(file.created * 1000);
      participants = [file.user];
    }

    const payload: Omit<KushimStandardRecord, 'checksum' | 'id'> = {
      externalId: `SLACK-${id}`,
      sourcePlatform: 'slack',
      artifactType: ArtifactType.MESSAGE,
      title: title || 'Untitled Message',
      body: body,
      url: url,
      author: author,
      timestamp: timestamp,
      participants: participants,
      metadata: {
        slackType: rawRecord.type,
        channel: rawRecord.channel,
      },
    };

    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      id: uuidv4(),
      ...payload,
      checksum,
    };
  }
}
