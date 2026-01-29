import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    // Set test database URL for the test
    process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(async () => {
    // Disconnect after each test
    if (service) {
      await service.$disconnect();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have $connect method', () => {
    expect(service.$connect).toBeDefined();
  });

  it('should have $disconnect method', () => {
    expect(service.$disconnect).toBeDefined();
  });
});
