import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/utils';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_token'),
            verify: jest.fn().mockReturnValue({ userId: '1', email: 'test@example.com' }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
        totpSecret: null,
        mfaEnabled: false,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        username: mockUser.username,
      });
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
        updatedAt: new Date(),
        totpSecret: null,
        mfaEnabled: false,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('test@example.com', 'wrong_password');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return JWT token', async () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        username: 'testuser',
      };

      const result = await service.login(user);

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock_token');
      expect(jwtService.sign).toHaveBeenCalledWith({
        userId: user.id,
        email: user.email,
        username: user.username,
      });
    });
  });
});
