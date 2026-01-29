import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { createMockPrismaService } from '../../test/utils';
import * as argon2 from 'argon2';

jest.mock('argon2');

describe('UsersService', () => {
  let service: UsersService;
  let prisma: ReturnType<typeof createMockPrismaService>;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should find a user by email', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        passwordHash: 'hash',
        roleId: 'role-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: 'role-1',
          name: 'USER',
          createdAt: new Date(),
        },
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findOne('test@example.com');

      expect(result).toEqual(mockUser);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
        include: { role: true },
      });
    });

    it('should return null if user not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.findOne('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const mockRole = {
        id: 'role-1',
        name: 'USER',
        createdAt: new Date(),
      };

      const mockUser = {
        id: '1',
        email: 'new@example.com',
        passwordHash: 'hashed_password',
        roleId: 'role-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: mockRole,
      };

      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      prisma.user.findUnique = jest.fn(); // Reset findUnique mock
      (prisma as any).role = {
        findUnique: jest.fn().mockResolvedValue(mockRole),
      };
      prisma.user.create.mockResolvedValue(mockUser);

      const result = await service.create('new@example.com', 'password123');

      expect(result).toEqual(mockUser);
      expect(argon2.hash).toHaveBeenCalledWith('password123');
      expect((prisma as any).role.findUnique).toHaveBeenCalledWith({
        where: { name: 'USER' },
      });
      expect(prisma.user.create).toHaveBeenCalledWith({
        data: {
          email: 'new@example.com',
          passwordHash: 'hashed_password',
          roleId: 'role-1',
        },
        include: { role: true },
      });
    });

    it('should throw error if role not found', async () => {
      (argon2.hash as jest.Mock).mockResolvedValue('hashed_password');
      (prisma as any).role = {
        findUnique: jest.fn().mockResolvedValue(null),
      };

      await expect(
        service.create('new@example.com', 'password123', 'INVALID_ROLE')
      ).rejects.toThrow('Role INVALID_ROLE not found');
    });
  });
});
