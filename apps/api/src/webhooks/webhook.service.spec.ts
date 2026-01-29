import { Test, TestingModule } from '@nestjs/testing';
import { WebhookService } from './webhook.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { Queue } from 'bullmq';
import * as crypto from 'crypto';

describe('WebhookService', () => {
  let service: WebhookService;
  let prismaService: PrismaService;
  let mockQueue: Partial<Queue>;

  beforeEach(async () => {
    mockQueue = {
      add: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: 'BullQueue_webhook-events',
          useValue: mockQueue,
        },
        {
          provide: PrismaService,
          useValue: {
            dataSource: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: AuditService,
          useValue: {
            log: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<WebhookService>(WebhookService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('verifyGithubSignature', () => {
    it('should verify valid GitHub signature', () => {
      const secret = 'test-secret';
      const payload = JSON.stringify({ test: 'data' });
      const signature =
        'sha256=' +
        crypto.createHmac('sha256', secret).update(payload).digest('hex');

      process.env.GITHUB_WEBHOOK_SECRET = secret;

      const result = service.verifyGithubSignature(payload, signature);
      expect(result).toBe(true);
    });

    it('should reject invalid GitHub signature', () => {
      process.env.GITHUB_WEBHOOK_SECRET = 'test-secret';
      const payload = JSON.stringify({ test: 'data' });
      // Create a valid format but wrong signature
      const wrongSignature = 'sha256=' + 'a'.repeat(64); // Valid hex length but wrong value

      const result = service.verifyGithubSignature(payload, wrongSignature);
      expect(result).toBe(false);
    });

    it('should return false when secret is not configured', () => {
      delete process.env.GITHUB_WEBHOOK_SECRET;
      const result = service.verifyGithubSignature('payload', 'signature');
      expect(result).toBe(false);
    });
  });

  describe('verifySlackSignature', () => {
    it('should verify valid Slack signature', () => {
      const secret = 'test-secret';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const body = 'test-body';
      const sigBasestring = `v0:${timestamp}:${body}`;
      const signature =
        'v0=' +
        crypto.createHmac('sha256', secret).update(sigBasestring).digest('hex');

      process.env.SLACK_SIGNING_SECRET = secret;

      const result = service.verifySlackSignature(timestamp, signature, body);
      expect(result).toBe(true);
    });

    it('should reject old timestamps', () => {
      const secret = 'test-secret';
      const oldTimestamp = (Math.floor(Date.now() / 1000) - 400).toString();
      const body = 'test-body';
      const sigBasestring = `v0:${oldTimestamp}:${body}`;
      const signature =
        'v0=' +
        crypto.createHmac('sha256', secret).update(sigBasestring).digest('hex');

      process.env.SLACK_SIGNING_SECRET = secret;

      const result = service.verifySlackSignature(
        oldTimestamp,
        signature,
        body,
      );
      expect(result).toBe(false);
    });
  });

  describe('queueWebhookEvent', () => {
    it('should queue webhook event successfully', async () => {
      const event = {
        platform: 'github' as const,
        eventType: 'issues',
        payload: { test: 'data' },
        userId: 'user-123',
        receivedAt: new Date(),
      };

      await service.queueWebhookEvent(event);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'process-webhook',
        event,
        expect.objectContaining({
          attempts: 3,
          backoff: expect.any(Object),
        }),
      );
    });
  });

  describe('getUserIdForPlatformResource', () => {
    it('should return userId for matching platform connection', async () => {
      const userId = 'user-123';
      const mockDataSource = { userId };
      
      jest
        .spyOn(prismaService.dataSource, 'findFirst')
        .mockResolvedValue(mockDataSource as any);

      const result = await service.getUserIdForPlatformResource(
        'github',
        'resource-123',
      );

      expect(result).toBe(userId);
      expect(prismaService.dataSource.findFirst).toHaveBeenCalledWith({
        where: {
          providerName: 'github',
        },
        select: { userId: true },
      });
    });

    it('should return null when no connection found', async () => {
      jest
        .spyOn(prismaService.dataSource, 'findFirst')
        .mockResolvedValue(null);

      const result = await service.getUserIdForPlatformResource(
        'github',
        'resource-123',
      );

      expect(result).toBeNull();
    });
  });
});
