import { BaseAdapter, NormalizedRecord } from './base.adapter';
import { createHash } from 'crypto';
import { Version3Client } from 'jira.js';

export class JiraAdapter extends BaseAdapter {
  name = 'jira';

  async fetch(credentials: any): Promise<any[]> {
    if (!credentials?.host || !credentials?.email || !credentials?.apiToken) {
      throw new Error('Jira host, email, and apiToken are required');
    }

    const client = new Version3Client({
      host: credentials.host,
      authentication: {
        basic: {
          email: credentials.email,
          apiToken: credentials.apiToken,
        },
      },
    });

    try {
      const search = await client.issueSearch.searchForIssuesUsingJql({
        jql: 'assignee = currentUser() AND resolution = Unresolved ORDER BY priority DESC',
        maxResults: 20,
      });
      return search.issues || [];
    } catch (error) {
      console.error('Jira API Error:', error);
      throw new Error('Failed to fetch data from Jira');
    }
  }

  normalize(rawRecord: any): NormalizedRecord {
    const payload = {
      externalId: rawRecord.key, // Use Key (e.g., PROJ-123) as external ID
      title: rawRecord.fields.summary,
      type: 'task',
      url: `${rawRecord.self.split('/rest/api')[0]}/browse/${rawRecord.key}`, // Construct web URL
      metadata: {
        status: rawRecord.fields.status?.name,
        priority: rawRecord.fields.priority?.name,
        project: rawRecord.fields.project?.name,
        created: rawRecord.fields.created,
        source: 'jira',
      },
    };
    
    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      id: rawRecord.id, // Internal Jira ID
      payload,
      checksum,
    };
  }
}