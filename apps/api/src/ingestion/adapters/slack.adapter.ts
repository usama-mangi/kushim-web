import { BaseAdapter, NormalizedRecord } from './base.adapter';
import { createHash } from 'crypto';

export class SlackAdapter extends BaseAdapter {
  name = 'slack';

  async fetch(credentials: any): Promise<any[]> {
    // Mock data for Slack messages
    return [
      { id: 'msg-1', channel: '#general', user: 'alice', text: 'Has anyone seen the new design specs?', ts: '1678900001' },
      { id: 'msg-2', channel: '#dev', user: 'bob', text: 'Deploying to staging in 5 mins.', ts: '1678900005' },
    ];
  }

  normalize(rawRecord: any): NormalizedRecord {
    const payload = {
      externalId: rawRecord.id,
      title: `Message from ${rawRecord.user} in ${rawRecord.channel}`,
      type: 'message',
      metadata: {
        text: rawRecord.text,
        timestamp: rawRecord.ts,
        source: 'slack',
      },
    };
    
    // Create a unique checksum based on the content
    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      id: rawRecord.id,
      payload,
      checksum,
    };
  }
}
