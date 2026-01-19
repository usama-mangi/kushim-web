import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { Octokit } from 'octokit';
import { RelationshipService } from '../records/relationship.service';

export enum ActionVerb {
  COMMENT = 'comment',
  ASSIGN = 'assign',
  REPLY = 'reply',
  CLOSE = 'close',
  LINK = 'link',
}

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
    private relationshipService: RelationshipService,
  ) {}

  async executeCommand(userId: string, command: string) {
    const parts = command.split(' ');
    const verb = parts[0].toLowerCase() as ActionVerb;
    const targetQuery = parts[1];
    const payload = parts.slice(2).join(' ');

    this.logger.log(`Executing command: ${verb} on ${targetQuery}`);

    if (verb === ActionVerb.LINK) {
      const targetQuery2 = parts[2];
      if (!targetQuery2) throw new Error('Link command requires two targets');

      const recordA = await this.findRecord(userId, targetQuery);
      const recordB = await this.findRecord(userId, targetQuery2);

      await this.relationshipService.createManualLink(userId, recordA.id, recordB.id);
      
      return {
        success: true,
        message: `Successfully linked ${recordA.title} and ${recordB.title}`,
        recordId: recordA.id,
      };
    }

    const record = await this.findRecord(userId, targetQuery);
    // Reuse existing logic for other verbs...
    // I need to refactor finding record to a helper method since I need it twice for link.
    // Or just inline it. Refactoring is better.
    
    // ... (rest of the file uses record)
    let credentials: any = record.source.credentialsEncrypted;
    if (
      credentials &&
      typeof credentials === 'object' &&
      '_encrypted' in credentials
    ) {
      credentials = await this.encryptionService.decryptObject(credentials);
    }

    if (!credentials) throw new Error('Source credentials not found');

    const metadata = record.metadata as any;
    if (!metadata) throw new Error('Record metadata not found');

    if (record.sourcePlatform === 'github' && verb === ActionVerb.COMMENT) {
      const token = credentials.token as string;
      if (!token) throw new Error('GitHub token not found in credentials');

      const octokit = new Octokit({ auth: token });
      const repoPath = metadata['repository'] as string;
      if (!repoPath) throw new Error('Repository path not found in metadata');

      const [owner, repo] = repoPath.split('/');
      const issueNumber = metadata['number'] as number;
      if (!issueNumber) throw new Error('Issue number not found in metadata');

      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: issueNumber,
        body: payload,
      });
    }

    return {
      success: true,
      message: `Successfully executed ${verb} on ${record.sourcePlatform}`,
      recordId: record.id,
    };
  }

  private async findRecord(userId: string, query: string) {
    const record = await this.prisma.unifiedRecord.findFirst({
      where: {
        userId,
        OR: [
          { externalId: query },
          { title: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: { source: true },
    });

    if (!record) throw new Error(`Target record "${query}" not found`);
    return record;
  }
}
