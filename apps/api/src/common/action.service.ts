import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from './encryption.service';
import { Octokit } from 'octokit';

export enum ActionVerb {
  COMMENT = 'comment',
  ASSIGN = 'assign',
  REPLY = 'reply',
  CLOSE = 'close',
}

@Injectable()
export class ActionService {
  private readonly logger = new Logger(ActionService.name);

  constructor(
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {}

  async executeCommand(userId: string, command: string) {
    const parts = command.split(' ');
    const verb = parts[0].toLowerCase() as ActionVerb;
    const targetQuery = parts[1];
    const payload = parts.slice(2).join(' ');

    this.logger.log(`Executing command: ${verb} on ${targetQuery}`);

    const record = await this.prisma.unifiedRecord.findFirst({
      where: {
        userId,
        OR: [
          { externalId: targetQuery },
          { title: { contains: targetQuery, mode: 'insensitive' } },
        ],
      },
      include: { source: true },
    });

    if (!record) throw new Error(`Target record "${targetQuery}" not found`);

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
}
