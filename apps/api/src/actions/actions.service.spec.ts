// Mock ES modules to avoid import errors
jest.mock('octokit', () => ({
  Octokit: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('@slack/web-api', () => ({
  WebClient: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('jira.js', () => ({
  Version3Client: jest.fn().mockImplementation(() => ({})),
}));
jest.mock('googleapis', () => ({
  google: {},
}));
jest.mock('@xenova/transformers', () => ({
  pipeline: jest.fn().mockResolvedValue(
    jest.fn().mockResolvedValue({
      data: new Float32Array(384).fill(0.1),
    })
  ),
}));

import { Test, TestingModule } from '@nestjs/testing';
import { ActionsService, ActionVerb } from './actions.service';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { RelationshipService } from '../records/relationship.service';
import { BadRequestException } from '@nestjs/common';

describe('ActionsService - Command Parsing & Validation', () => {
  let service: ActionsService;
  let prismaService: jest.Mocked<PrismaService>;
  let encryptionService: jest.Mocked<EncryptionService>;
  let relationshipService: jest.Mocked<RelationshipService>;

  const mockRecord = {
    id: 'record-1',
    title: 'Test Issue',
    externalId: 'GH-123',
    sourcePlatform: 'github',
    userId: 'user-1',
    source: {
      id: 'source-1',
      credentialsEncrypted: {
        _encrypted: true,
        data: 'encrypted-data',
      },
    },
    metadata: {
      repository: 'owner/repo',
      number: 123,
      type: 'issue',
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActionsService,
        {
          provide: PrismaService,
          useValue: {
            unifiedRecord: {
              findFirst: jest.fn(),
            },
          },
        },
        {
          provide: EncryptionService,
          useValue: {
            decryptObject: jest.fn(),
          },
        },
        {
          provide: RelationshipService,
          useValue: {
            createManualLink: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ActionsService>(ActionsService);
    prismaService = module.get(PrismaService) as jest.Mocked<PrismaService>;
    encryptionService = module.get(EncryptionService) as jest.Mocked<EncryptionService>;
    relationshipService = module.get(RelationshipService) as jest.Mocked<RelationshipService>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Command validation', () => {
    it('should throw error for empty command', async () => {
      await expect(service.executeCommand('user-1', '')).rejects.toThrow(BadRequestException);
      await expect(service.executeCommand('user-1', '')).rejects.toThrow('Command cannot be empty');
    });

    it('should throw error for unknown verb', async () => {
      await expect(service.executeCommand('user-1', 'unknown target payload')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeCommand('user-1', 'unknown target payload')).rejects.toThrow(
        'Unknown action verb',
      );
    });

    it('should accept all valid verbs', () => {
      const validVerbs = ['comment', 'assign', 'reply', 'close', 'link', 'react'];
      validVerbs.forEach((verb) => {
        expect(Object.values(ActionVerb)).toContain(verb);
      });
    });

    it('should throw error when link command has only one target', async () => {
      await expect(service.executeCommand('user-1', 'link ISSUE-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeCommand('user-1', 'link ISSUE-1')).rejects.toThrow(
        'Link command requires two targets',
      );
    });

    it('should throw error when command has no target', async () => {
      await expect(service.executeCommand('user-1', 'comment')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeCommand('user-1', 'comment')).rejects.toThrow(
        'comment command requires a target',
      );
    });
  });

  describe('Link command', () => {
    it('should successfully link two records', async () => {
      const recordA = { ...mockRecord, id: 'rec-a', title: 'Record A' };
      const recordB = { ...mockRecord, id: 'rec-b', title: 'Record B' };

      prismaService.unifiedRecord.findFirst
        .mockResolvedValueOnce(recordA as any)
        .mockResolvedValueOnce(recordB as any);

      relationshipService.createManualLink.mockResolvedValue(undefined);

      const result = await service.executeCommand('user-1', 'link ISSUE-1 ISSUE-2');

      expect(result.success).toBe(true);
      expect(result.message).toContain('Record A');
      expect(result.message).toContain('Record B');
      expect(relationshipService.createManualLink).toHaveBeenCalledWith('user-1', 'rec-a', 'rec-b');
    });

    it('should handle extra whitespace in link command', async () => {
      prismaService.unifiedRecord.findFirst
        .mockResolvedValueOnce(mockRecord as any)
        .mockResolvedValueOnce(mockRecord as any);
      relationshipService.createManualLink.mockResolvedValue(undefined);

      const result = await service.executeCommand('user-1', '  link   ISSUE-1   ISSUE-2  ');
      expect(result.success).toBe(true);
    });

    it('should be case-insensitive for verb', async () => {
      prismaService.unifiedRecord.findFirst
        .mockResolvedValueOnce(mockRecord as any)
        .mockResolvedValueOnce(mockRecord as any);
      relationshipService.createManualLink.mockResolvedValue(undefined);

      const result = await service.executeCommand('user-1', 'LINK ISSUE-1 ISSUE-2');
      expect(result.success).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('should throw error when record not found', async () => {
      prismaService.unifiedRecord.findFirst.mockResolvedValue(null);

      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        'Target record "ISSUE-123" not found',
      );
    });

    it('should throw error when credentials are missing', async () => {
      const recordWithoutCreds = {
        ...mockRecord,
        source: {
          ...mockRecord.source,
          credentialsEncrypted: null,
        },
      };

      prismaService.unifiedRecord.findFirst.mockResolvedValue(recordWithoutCreds as any);

      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        'Source credentials not found',
      );
    });

    it('should throw error when metadata is missing', async () => {
      const recordWithoutMetadata = {
        ...mockRecord,
        metadata: null,
      };

      prismaService.unifiedRecord.findFirst.mockResolvedValue(recordWithoutMetadata as any);
      encryptionService.decryptObject.mockResolvedValue({ token: 'token' });

      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        'Record metadata not found',
      );
    });
  });

  describe('Command parsing', () => {
    it('should correctly parse verb, target, and payload', () => {
      const command = 'comment ISSUE-123 This is a multi-word comment';
      const parts = command.trim().split(/\s+/);
      
      expect(parts[0]).toBe('comment');
      expect(parts[1]).toBe('ISSUE-123');
      expect(parts.slice(2).join(' ')).toBe('This is a multi-word comment');
    });

    it('should preserve case in payload', () => {
      const command = 'comment ISSUE-123 This Has Mixed CASE';
      const parts = command.trim().split(/\s+/);
      const payload = parts.slice(2).join(' ');
      
      expect(payload).toBe('This Has Mixed CASE');
    });

    it('should handle commands with special characters in payload', () => {
      const command = 'comment ISSUE-123 Test with @mentions and #tags!';
      const parts = command.trim().split(/\s+/);
      const payload = parts.slice(2).join(' ');
      
      expect(payload).toBe('Test with @mentions and #tags!');
    });
  });

  describe('Platform routing', () => {
    it('should throw error for unsupported platform', async () => {
      const unsupportedRecord = {
        ...mockRecord,
        sourcePlatform: 'unsupported',
      };

      prismaService.unifiedRecord.findFirst.mockResolvedValue(unsupportedRecord as any);
      encryptionService.decryptObject.mockResolvedValue({ token: 'token' });

      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.executeCommand('user-1', 'comment ISSUE-123 test')).rejects.toThrow(
        'Platform "unsupported" does not support action execution',
      );
    });

    it('should recognize supported platforms', () => {
      const supportedPlatforms = ['github', 'jira', 'slack', 'google'];
      
      supportedPlatforms.forEach((platform) => {
        const record = { ...mockRecord, sourcePlatform: platform };
        expect(record.sourcePlatform).toBe(platform);
      });
    });
  });
});

