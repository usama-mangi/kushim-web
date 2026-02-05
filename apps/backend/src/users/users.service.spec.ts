import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

describe('UsersService', () => {
  let service: UsersService;
  let prismaService: PrismaService;
  let emailService: EmailService;
  let auditService: AuditService;

  const mockPrismaService = {
    user: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    userInvitation: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockEmailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendInvitationEmail: jest.fn(),
  };

  const mockAuditService = {
    log: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    emailService = module.get<EmailService>(EmailService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all users for a customer', async () => {
      const customerId = 'customer-1';
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: UserRole.USER,
          emailVerified: true,
          isActive: true,
          lastLoginAt: new Date(),
          loginCount: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.findAll(customerId);

      expect(result).toEqual(mockUsers);
      expect(mockPrismaService.user.findMany).toHaveBeenCalledWith({
        where: { customerId },
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findById', () => {
    it('should return a user by ID', async () => {
      const userId = 'user-1';
      const customerId = 'customer-1';
      const mockUser = {
        id: userId,
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        emailVerified: true,
        isActive: true,
        lastLoginAt: new Date(),
        loginCount: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);

      const result = await service.findById(userId, customerId);

      expect(result).toEqual(mockUser);
      expect(mockPrismaService.user.findFirst).toHaveBeenCalledWith({
        where: { id: userId, customerId },
        select: expect.any(Object),
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.findById('user-1', 'customer-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('inviteUser', () => {
    it('should create an invitation and send email', async () => {
      const inviteDto = { email: 'newuser@example.com', role: UserRole.USER };
      const inviterId = 'admin-1';
      const customerId = 'customer-1';

      const mockInviter = {
        id: inviterId,
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
        customerId,
        customer: { name: 'Test Org' },
      };

      const mockInvitation = {
        id: 'invitation-1',
        email: inviteDto.email,
        role: inviteDto.role,
        token: 'token-123',
        status: 'PENDING',
        expiresAt: new Date(),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockInviter);
      mockPrismaService.user.findFirst.mockResolvedValue(null);
      mockPrismaService.userInvitation.findFirst.mockResolvedValue(null);
      mockPrismaService.userInvitation.create.mockResolvedValue(mockInvitation);
      mockEmailService.sendInvitationEmail.mockResolvedValue(undefined);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.inviteUser(inviteDto, inviterId, customerId);

      expect(result.email).toBe(inviteDto.email);
      expect(mockEmailService.sendInvitationEmail).toHaveBeenCalled();
      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('should throw ForbiddenException if inviter is not admin', async () => {
      const inviteDto = { email: 'newuser@example.com', role: UserRole.USER };
      const inviterId = 'user-1';
      const customerId = 'customer-1';

      const mockInviter = {
        id: inviterId,
        role: UserRole.USER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockInviter);

      await expect(
        service.inviteUser(inviteDto, inviterId, customerId),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw ConflictException if user already exists', async () => {
      const inviteDto = { email: 'existing@example.com', role: UserRole.USER };
      const inviterId = 'admin-1';
      const customerId = 'customer-1';

      const mockInviter = {
        id: inviterId,
        role: UserRole.ADMIN,
        customer: {},
      };

      const mockExistingUser = {
        id: 'existing-user',
        email: inviteDto.email,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockInviter);
      mockPrismaService.user.findFirst.mockResolvedValue(mockExistingUser);

      await expect(
        service.inviteUser(inviteDto, inviterId, customerId),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('deactivateUser', () => {
    it('should deactivate a user', async () => {
      const userId = 'user-1';
      const customerId = 'customer-1';
      const requesterId = 'admin-1';

      const mockRequester = {
        id: requesterId,
        role: UserRole.ADMIN,
      };

      const mockUser = {
        id: userId,
        email: 'user@example.com',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockRequester);
      mockPrismaService.user.findFirst.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        isActive: false,
      });
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.deactivateUser(
        userId,
        customerId,
        requesterId,
      );

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { isActive: false },
      });
    });

    it('should throw ForbiddenException if requester is not admin', async () => {
      const mockRequester = {
        id: 'user-1',
        role: UserRole.USER,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockRequester);

      await expect(
        service.deactivateUser('user-2', 'customer-1', 'user-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
