import { BaseAdapter, NormalizedRecord } from './base.adapter';
import { createHash } from 'crypto';
import { Octokit } from 'octokit';

export class GithubAdapter extends BaseAdapter {
  name = 'github';

  async fetch(credentials: any): Promise<any[]> {
    if (!credentials?.token) {
      // Fallback for seed data if no token is provided, or throw error
      // Ideally we shouldn't have mock data anymore, but for the 'default-github-source' 
      // in seed which has empty credentials, this will fail.
      // I will throw an error to enforce real credentials.
      throw new Error('GitHub Personal Access Token is required in credentials');
    }

    const octokit = new Octokit({ auth: credentials.token });
    
    // Fetch issues assigned to the user
    try {
      const { data } = await octokit.rest.issues.list({
        filter: 'assigned',
        state: 'open',
        per_page: 20,
      });
      return data;
    } catch (error) {
      console.error('GitHub API Error:', error);
      throw new Error('Failed to fetch data from GitHub');
    }
  }

  normalize(rawRecord: any): NormalizedRecord {
    const payload = {
      externalId: String(rawRecord.id),
      title: rawRecord.title,
      type: 'issue',
      url: rawRecord.html_url,
      metadata: {
        repository: rawRecord.repository?.full_name || 'unknown',
        number: rawRecord.number,
        state: rawRecord.state,
        created_at: rawRecord.created_at,
        source: 'github',
      },
    };
    
    const checksum = createHash('sha256')
      .update(JSON.stringify(payload))
      .digest('hex');

    return {
      id: String(rawRecord.id),
      payload,
      checksum,
    };
  }
}