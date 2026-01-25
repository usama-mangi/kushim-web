import { BaseAdapter } from './base.adapter';
import { createHash } from 'crypto';
import { Version3Client } from 'jira.js';
import { KushimStandardRecord, ArtifactType } from '../../common/ksr.interface';
import { v4 as uuidv4 } from 'uuid';

export class JiraAdapter extends BaseAdapter {
  name = 'jira';

  async fetch(credentials: any, lastSync?: Date): Promise<any[]> {
    if (!credentials?.host && !credentials?.cloudId) {
       // OAuth flow might return cloudId or we might need to fetch resources accessible
    }

    const token = credentials.accessToken;
    const email = credentials.email;
    const apiToken = credentials.apiToken;

    if (!credentials.host) {
        throw new Error('Jira Host is required');
    }

    try {
      // Jira's new /search/jql endpoint requires bounded queries.
      // We'll add a default restriction of 'updated >= -30d' if no lastSync is provided.
      let jql = 'updated >= -30d order by updated DESC';
      if (lastSync) {
        const dateStr = lastSync.toISOString().replace('T', ' ').substring(0, 16);
        jql = `updated >= "${dateStr}" order by updated DESC`;
      }

      // Construct URL manually to ensure it's correct for OAuth vs Basic
      // credentials.host is like https://api.atlassian.com/ex/jira/{cloudId} for OAuth
      // or https://domain.atlassian.net for Basic
      
      // Update: /rest/api/3/search (POST) is deprecated/removed for some contexts. 
      // Error message explicitly requested migration to /rest/api/3/search/jql
      const searchUrl = `${credentials.host}/rest/api/3/search/jql`;

      
      const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      } else if (email && apiToken) {
        const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
        headers['Authorization'] = `Basic ${auth}`;
      } else {
        throw new Error('No valid credentials provided');
      }

      console.log(`Fetching Jira: ${searchUrl} with JQL: ${jql}`);

      const response = await fetch(searchUrl, {
        method: 'POST', // Use POST for search to avoid query string length limits and encoding issues
        headers,
        body: JSON.stringify({
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
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error(`Jira API Error ${response.status}: ${errText}`);
        const error = new Error(`Jira API Request failed: ${response.status} ${response.statusText}`);
        (error as any).statusCode = response.status; // Preserve status code
        throw error;
      }

      const data: any = await response.json();
      return data.issues || [];

    } catch (error) {
      console.error('Jira API Error:', error);
      // Re-throw original error to preserve status code information
      throw error;
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
