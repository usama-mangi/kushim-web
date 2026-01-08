import { BaseAdapter, NormalizedRecord } from './base.adapter';
import { createHash } from 'crypto';

export class JiraAdapter extends BaseAdapter {
  name = 'jira';

  async fetch(credentials: any): Promise<any[]> {
    // Mock data for Jira issues
    return [
      { id: 'JIRA-101', title: 'Implement Backend API', status: 'In Progress', priority: 'High' },
      { id: 'JIRA-102', title: 'Design Database Schema', status: 'Done', priority: 'Medium' },
      { id: 'JIRA-103', title: 'Setup CI/CD Pipeline', status: 'To Do', priority: 'Critical' },
    ];
  }

  normalize(rawRecord: any): NormalizedRecord {
    const payload = {
      externalId: rawRecord.id,
      title: rawRecord.title,
      type: 'task',
      metadata: {
        status: rawRecord.status,
        priority: rawRecord.priority,
        source: 'jira',
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
