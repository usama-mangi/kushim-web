import { BaseAdapter } from './base.adapter';
import { createHash } from 'crypto';
import { Version3Client } from 'jira.js';
import { KushimStandardRecord, ArtifactType } from '../../common/ksr.interface';
import { v4 as uuidv4 } from 'uuid';

export class JiraAdapter extends BaseAdapter {
  name = 'jira';

  async fetch(credentials: any, lastSync?: Date): Promise<any[]> {
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
      let jql = 'order by updated DESC';
      if (lastSync) {
        // Jira JQL uses yyyy-MM-dd HH:mm or similar
        const dateStr = lastSync
          .toISOString()
          .replace('T', ' ')
          .substring(0, 16);
        jql = `updated >= "${dateStr}" ${jql}`;
      }

      const search = await client.issueSearch.searchForIssuesUsingJql({
        jql,
        maxResults: 50,
        fields: [
          'summary',
          'description',
          'status',
          'priority',
          'project',
          'created',
          'updated',
          'creator',
          'assignee',
          'reporter',
        ],
      });
      return search.issues || [];
    } catch (error) {
      console.error('Jira API Error:', error);
      throw new Error('Failed to fetch data from Jira');
    }
  }

  normalize(rawRecord: any): KushimStandardRecord {
    const fields = rawRecord.fields || {};

    const payload: Omit<KushimStandardRecord, 'checksum' | 'id'> = {
      externalId: rawRecord.key,
      sourcePlatform: 'jira',
      artifactType: ArtifactType.TASK,
      title: fields.summary,
      body: fields.description || '',
      url: `${rawRecord.self.split('/rest/api')[0]}/browse/${rawRecord.key}`,
      author:
        fields.creator?.emailAddress ||
        fields.creator?.displayName ||
        'unknown',
      timestamp: new Date(fields.updated || fields.created),
      participants: [
        fields.assignee?.emailAddress || fields.assignee?.displayName,
        fields.reporter?.emailAddress || fields.reporter?.displayName,
      ].filter(Boolean) as string[],
      metadata: {
        status: fields.status?.name,
        priority: fields.priority?.name,
        project: fields.project?.name,
        projectKey: fields.project?.key,
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
