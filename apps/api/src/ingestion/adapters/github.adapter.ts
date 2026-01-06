import { BaseAdapter, NormalizedRecord } from './base.adapter';
import { createHash } from 'crypto';

export class GithubAdapter extends BaseAdapter {
  name = 'github';

  async fetch(credentials: any): Promise<any[]> {
    // In a real implementation, we would use octokit or fetch with credentials.token
    // For now, we mock some data.
    return [
      { id: 'gh-1', name: 'repo-1', stars: 10 },
      { id: 'gh-2', name: 'repo-2', stars: 20 },
    ];
  }

  normalize(rawRecord: any): NormalizedRecord {
    const payload = {
      externalId: rawRecord.id,
      name: rawRecord.name,
      metadata: { stars: rawRecord.stars },
    };
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
