import { BaseAdapter } from './base.adapter';
import { createHash } from 'crypto';
import { Octokit } from 'octokit';
import { KushimStandardRecord, ArtifactType } from '../../common/ksr.interface';
import { GitHubCredentials, isGitHubCredentials } from '../../common/oauth-credentials.types';
import { v4 as uuidv4 } from 'uuid';

export class GithubAdapter extends BaseAdapter {
  name = 'github';

  constructor() {
    super();
  }

  async fetch(credentials: GitHubCredentials, lastSync?: Date): Promise<any[]> {
    if (!isGitHubCredentials(credentials)) {
      throw new Error('Invalid GitHub credentials format');
    }

    const octokit = new Octokit({ auth: credentials.token });

    try {
      const { data } = await octokit.rest.issues.list({
        filter: 'all',
        state: 'all',
        since: lastSync ? lastSync.toISOString() : undefined,
        per_page: 50,
      });
      return data;
    } catch (error) {
      this.logger.error('GitHub API Error', error);
      throw new Error('Failed to fetch data from GitHub');
    }
  }

  normalize(rawRecord: any): KushimStandardRecord {
    const payload: Omit<KushimStandardRecord, 'checksum' | 'id'> = {
      externalId: `GH-${rawRecord.number}`,
      sourcePlatform: 'github',
      artifactType: rawRecord.pull_request
        ? ArtifactType.PULL_REQUEST
        : ArtifactType.ISSUE,
      title: rawRecord.title,
      body: rawRecord.body || '',
      url: rawRecord.html_url,
      author: rawRecord.user?.login || 'unknown',
      timestamp: new Date(rawRecord.updated_at || rawRecord.created_at),
      participants: (rawRecord.assignees || []).map((a: any) => a.login),
      metadata: {
        repository: rawRecord.repository?.full_name,
        number: rawRecord.number,
        state: rawRecord.state,
        labels: (rawRecord.labels || []).map((l: any) => l.name),
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
