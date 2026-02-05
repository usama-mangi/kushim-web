import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../shared/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { EmailService } from '../email/email.service';
import { AuditService } from '../audit/audit.service';
import {
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;
  let emailService: EmailService;
  let auditService: AuditService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    customer: {
      create: jest.fn(),
    },
    userInvitation: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockJwtService = {
    sign: jest.fn(),
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
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: EmailService, useValue: mockEmailService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    emailService = module.get<EmailService>(EmailService);
    auditService = module.get<AuditService>(AuditService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user and send verification email', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const mockCustomer = {
        id: 'customer-1',
        name: "John Doe's Org",
        email: registerDto.email,
      };

      const mockUser = {
        id: 'user-1',
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: UserRole.ADMIN,
        customerId: mockCustomer.id,
        emailVerificationToken: 'token-123',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.customer.create.mockResolvedValue(mockCustomer);
      mockPrismaService.user.create.mockResolvedValue(mockUser);
      mockEmailService.sendVerificationEmail.mockResolvedValue(undefined);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.register(registerDto);

      expect(result.success).toBe(true);
      expect(result.message).toContain('verify');
      expect(mockEmailService.sendVerificationEmail).toHaveBeenCalled();
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = {
        email: 'existing@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email and return JWT token', async () => {
      const token = 'verification-token';
      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ADMIN,
        customerId: 'customer-1',
        emailVerified: false,
        emailVerificationExpires: new Date(Date.now() + 3600000),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.user.update.mockResolvedValue({
        ...mockUser,
        emailVerified: true,
      });
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.verifyEmail(token);

      expect(result.token).toBe('jwt-token');
      expect(result.user.emailVerified).toBe(true);
    });

    it('should throw BadRequestException if token is invalid', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.verifyEmail('invalid-token')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException if email already verified', async () => {
      const mockUser = {
        id: 'user-1',
        emailVerified: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.verifyEmail('token')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('login', () => {
    it('should login user and return JWT token', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.USER,
        customerId: 'customer-1',
        emailVerified: true,
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.login(loginDto);

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe(loginDto.email);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      const loginDto = {
        email: 'nonexistent@example.com',
        password: 'Password123!',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'WrongPassword',
      };

      const mockUser = {
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
        isActive: true,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if user is deactivated', async () => {
      const loginDto = {
        email: 'user@example.com',
        password: 'Password123!',
      };

      const mockUser = {
        id: 'user-1',
        email: loginDto.email,
        password: 'hashed-password',
        isActive: false,
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const token = 'reset-token';
      const newPassword = 'NewPassword123!';

      const mockUser = {
        id: 'user-1',
        email: 'user@example.com',
        customerId: 'customer-1',
        resetPasswordExpires: new Date(Date.now() + 3600000),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('new-hashed-password');
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.resetPassword(token, newPassword);

      expect(result.success).toBe(true);
      expect(mockPrismaService.user.update).toHaveBeenCalled();
    });

    it('should throw BadRequestException if token is expired', async () => {
      const token = 'expired-token';
      const mockUser = {
        id: 'user-1',
        resetPasswordExpires: new Date(Date.now() - 3600000),
      };

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        service.resetPassword(token, 'NewPassword123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('acceptInvitation', () => {
    it('should accept invitation and create new user', async () => {
      const token = 'invitation-token';
      const password = 'Password123!';
      const firstName = 'Jane';
      const lastName = 'Doe';

      const mockInvitation = {
        id: 'invitation-1',
        email: 'newuser@example.com',
        role: UserRole.USER,
        customerId: 'customer-1',
        status: 'PENDING',
        expiresAt: new Date(Date.now() + 86400000),
        invitedById: 'admin-1',
        invitedBy: { id: 'admin-1' },
      };

      const mockNewUser = {
        id: 'user-2',
        email: mockInvitation.email,
        firstName,
        lastName,
        role: mockInvitation.role,
        customerId: mockInvitation.customerId,
        emailVerified: true,
      };

      mockPrismaService.userInvitation.findUnique.mockResolvedValue(
        mockInvitation,
      );
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');
      mockPrismaService.user.create.mockResolvedValue(mockNewUser);
      mockPrismaService.userInvitation.update.mockResolvedValue({
        ...mockInvitation,
        status: 'ACCEPTED',
      });
      mockJwtService.sign.mockReturnValue('jwt-token');
      mockAuditService.log.mockResolvedValue(undefined);

      const result = await service.acceptInvitation(
        token,
        password,
        firstName,
        lastName,
      );

      expect(result.token).toBe('jwt-token');
      expect(result.user.email).toBe(mockInvitation.email);
    });

    it('should throw NotFoundException if invitation not found', async () => {
      mockPrismaService.userInvitation.findUnique.mockResolvedValue(null);

      await expect(
        service.acceptInvitation('invalid-token', 'password', 'First', 'Last'),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
