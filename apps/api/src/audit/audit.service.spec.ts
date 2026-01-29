import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/utils';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    
    // Add activityLog mock
    (prisma as any).activityLog = {
      create: jest.fn(),
      findMany: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an activity log entry when user exists', async () => {
      const mockUser = { id: 'user-1' };
      const mockLog = {
        id: '1',
        userId: 'user-1',
        action: 'CREATE',
        resource: 'DataSource',
        payload: { platform: 'github' },
        ipAddress: '127.0.0.1',
        createdAt: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser as any);
      (prisma as any).activityLog.create.mockResolvedValue(mockLog);

      const result = await service.log({
        userId: 'user-1',
        action: 'CREATE',
        resource: 'DataSource',
        payload: { platform: 'github' },
        ipAddress: '127.0.0.1',
      });

      expect(result).toEqual(mockLog);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        select: { id: true },
      });
      expect((prisma as any).activityLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'CREATE',
          resource: 'DataSource',
          payload: { platform: 'github' },
          ipAddress: '127.0.0.1',
        },
      });
    });

    it('should return null if user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.log({
        userId: 'non-existent',
        action: 'CREATE',
        resource: 'DataSource',
      });

      expect(result).toBeNull();
      expect((prisma as any).activityLog.create).not.toHaveBeenCalled();
    });

    it('should log without userId if not provided', async () => {
      const mockLog = {
        id: '1',
        userId: null,
        action: 'SYSTEM_EVENT',
        resource: 'Config',
        payload: {},
        createdAt: new Date(),
      };

      (prisma as any).activityLog.create.mockResolvedValue(mockLog);

      const result = await service.log({
        action: 'SYSTEM_EVENT',
        resource: 'Config',
      });

      expect(result).toEqual(mockLog);
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return null on error and not throw', async () => {
      prisma.user.findUnique.mockRejectedValue(new Error('Database error'));

      const result = await service.log({
        userId: 'user-1',
        action: 'CREATE',
        resource: 'DataSource',
      });

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all activity logs', async () => {
      const mockLogs = [
        {
          id: '1',
          userId: 'user-1',
          action: 'CREATE',
          resource: 'DataSource',
          payload: {},
          createdAt: new Date(),
          user: { email: 'test@example.com' },
        },
      ];

      (prisma as any).activityLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.findAll();

      expect(result).toEqual(mockLogs);
      expect((prisma as any).activityLog.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              email: true,
            },
          },
        },
        take: 100,
      });
    });
  });
});
