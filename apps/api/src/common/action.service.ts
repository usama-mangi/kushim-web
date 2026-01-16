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

    let credentials = record.source.credentialsEncrypted;
    if (
      credentials &&
      typeof credentials === 'object' &&
      '_encrypted' in credentials
    ) {
      credentials = await this.encryptionService.decryptObject(credentials);
    }

    if (record.sourcePlatform === 'github' && verb === ActionVerb.COMMENT) {
      const octokit = new Octokit({ auth: credentials.token });
      const [owner, repo] = record.metadata['repository'].split('/');
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: record.metadata['number'],
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
