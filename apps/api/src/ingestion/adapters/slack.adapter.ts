import { BaseAdapter, NormalizedRecord } from './base.adapter';
import { createHash } from 'crypto';
import { WebClient } from '@slack/web-api';

export class SlackAdapter extends BaseAdapter {
  name = 'slack';

  async fetch(credentials: any): Promise<any[]> {
    if (!credentials?.token) {
      throw new Error('Slack User Token is required');
    }

    const client = new WebClient(credentials.token);

    try {
      // Fetch "Starred" items as they represent "To Do" or "Important" in Slack
      const result = await client.stars.list({ limit: 20 });
      return result.items || [];
    } catch (error) {
      console.error('Slack API Error:', error);
      throw new Error('Failed to fetch data from Slack');
    }
  }

  normalize(rawRecord: any): NormalizedRecord {
    // Slack starred items can be messages, files, etc.
    // We primarily care about messages.
    let title = 'Unknown Slack Item';
    let text = '';
    let url = '';
    let id = '';
    let created = '';

    if (rawRecord.type === 'message') {
      const msg = rawRecord.message;
      title = `Message from ${msg.user}`; // Ideally resolve user ID to name, but ID is fine for now
      text = msg.text;
      url = rawRecord.channel; // Deep link construction is complex without team info
      id = msg.ts;
      created = msg.ts;
    } else if (rawRecord.type === 'file') {
        title = rawRecord.file.name;
        text = rawRecord.file.permalink;
        id = rawRecord.file.id;
        created = String(rawRecord.file.created);
    }

    const payload = {
      externalId: id,
      title: title,
      type: 'message',
      url: url,
      metadata: {
        text: text,
        type: rawRecord.type,
        channel: rawRecord.channel,
        created,
        source: 'slack',
      },
    };
    
    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      id: id,
      payload,
      checksum,
    };
  }
}