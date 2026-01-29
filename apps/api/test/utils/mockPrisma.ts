import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Mock PrismaService for unit tests
 * Use this to avoid hitting the actual database in unit tests
 */
export const createMockPrismaService = () => {
  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    dataSource: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    unifiedRecord: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    recordLink: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    contextGroup: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    contextGroupMember: {
      findMany: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    actionHistory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => {
      if (typeof callback === 'function') {
        return callback(mockPrisma);
      }
      return Promise.resolve(callback);
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $executeRaw: jest.fn(),
    $queryRaw: jest.fn(),
  };

  return mockPrisma as unknown as PrismaClient;
};

/**
 * Setup test database for integration tests
 * Creates a real database connection and clears all tables
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/kushim_test',
      },
    },
  });

  await prisma.$connect();

  // Clear all tables in reverse order of dependencies
  await prisma.$executeRaw`TRUNCATE TABLE "ActionHistory" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "AuditLog" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ContextGroupMember" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "ContextGroup" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "RecordLink" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "UnifiedRecord" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "DataSource" CASCADE`;
  await prisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;

  return prisma;
}

/**
 * Teardown test database
 */
export async function teardownTestDatabase(prisma: PrismaClient): Promise<void> {
  await prisma.$disconnect();
}

/**
 * Create a test user
 */
export async function createTestUser(
  prisma: PrismaClient,
  overrides: Partial<Prisma.UserCreateInput> = {},
) {
  const timestamp = Date.now();
  return prisma.user.create({
    data: {
      email: overrides.email || `test-${timestamp}@example.com`,
      username: overrides.username || `testuser-${timestamp}`,
      passwordHash: overrides.passwordHash || '$argon2id$v=19$m=65536,t=3,p=4$test',
      ...overrides,
    },
  });
}

/**
 * Create a test data source
 */
export async function createTestDataSource(
  prisma: PrismaClient,
  userId: string,
  overrides: Partial<Prisma.DataSourceCreateInput> = {},
) {
  return prisma.dataSource.create({
    data: {
      userId,
      providerName: overrides.providerName || 'github',
      credentialsEncrypted: overrides.credentialsEncrypted || { access_token: 'test_token' },
      ...overrides,
    },
  });
}

/**
 * Create a test unified record
 */
export async function createTestRecord(
  prisma: PrismaClient,
  userId: string,
  sourceId: string,
  overrides: Partial<Prisma.UnifiedRecordCreateInput> = {},
) {
  const timestamp = Date.now();
  return prisma.unifiedRecord.create({
    data: {
      userId,
      sourceId,
      externalId: overrides.externalId || `ext-${timestamp}`,
      sourcePlatform: overrides.sourcePlatform || 'github',
      artifactType: overrides.artifactType || 'issue',
      title: overrides.title || 'Test Record',
      body: overrides.body || 'Test body',
      author: overrides.author || 'testuser',
      url: overrides.url || 'https://example.com',
      timestamp: overrides.timestamp || new Date(),
      participants: overrides.participants || ['testuser'],
      checksum: overrides.checksum || `checksum-${timestamp}`,
      ...overrides,
    },
  });
}

/**
 * Create a test record link
 */
export async function createTestLink(
  prisma: PrismaClient,
  userId: string,
  sourceRecordId: string,
  targetRecordId: string,
  overrides: Partial<Prisma.RecordLinkCreateInput> = {},
) {
  return prisma.recordLink.create({
    data: {
      userId,
      sourceRecordId,
      targetRecordId,
      score: overrides.score || 0.9,
      signals: overrides.signals || ['participant_overlap'],
      discoveryMethod: overrides.discoveryMethod || 'deterministic',
      explanation: overrides.explanation || {},
      ...overrides,
    },
  });
}

/**
 * Create a test context group
 */
export async function createTestContextGroup(
  prisma: PrismaClient,
  userId: string,
  overrides: Partial<Prisma.ContextGroupCreateInput> = {},
) {
  const timestamp = Date.now();
  return prisma.contextGroup.create({
    data: {
      userId,
      name: overrides.name || `Test Group ${timestamp}`,
      status: overrides.status || 'active',
      ...overrides,
    },
  });
}
