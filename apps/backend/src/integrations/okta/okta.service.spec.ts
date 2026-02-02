import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { OktaService } from './okta.service';
import * as okta from '@okta/okta-sdk-nodejs';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'OKTA_DOMAIN') return 'https://test.okta.com';
    if (key === 'OKTA_API_TOKEN') return 'test-token';
    return null;
  }),
};

// Mock Okta SDK
jest.mock('@okta/okta-sdk-nodejs', () => {
  return {
    Client: jest.fn().mockImplementation(() => {
      return {
        userApi: {
          listUsers: jest.fn(),
        },
        userFactorApi: {
          listFactors: jest.fn(),
        },
        policyApi: {
          listPolicies: jest.fn(),
        },
      };
    }),
  };
});

describe('OktaService', () => {
  let service: OktaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OktaService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<OktaService>(OktaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('collectMfaEnforcementEvidence', () => {
    it('should return PASS when all active users have MFA', async () => {
      const mockListUsers = jest.fn().mockReturnValue([
        { id: 'u1', status: 'ACTIVE', profile: { email: 'u1@example.com' } },
        { id: 'u2', status: 'ACTIVE', profile: { email: 'u2@example.com' } },
      ]);
      const mockListFactors = jest.fn().mockImplementation((params) => {
         if (params.userId === 'u1' || params.userId === 'u2') {
             return [{ id: 'f1', factorType: 'push', status: 'ACTIVE' }];
         }
         return [];
      });

      (okta.Client as unknown as jest.Mock).mockImplementation(() => ({
        userApi: {
            listUsers: mockListUsers,
        },
        userFactorApi: {
            listFactors: mockListFactors
        }
      }));

      // Re-create service
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OktaService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();
      service = module.get<OktaService>(OktaService);

      const result = await service.collectMfaEnforcementEvidence();

      expect(result.status).toBe('PASS');
      expect(result.data.mfaComplianceRate).toBe(1);
    });
  });

  describe('collectUserAccessEvidence', () => {
    it('should correctly count user statuses', async () => {
      const mockListUsers = jest.fn().mockReturnValue([
        { id: 'u1', status: 'ACTIVE' },
        { id: 'u2', status: 'SUSPENDED' },
        { id: 'u3', status: 'DEPROVISIONED' },
      ]);

      (okta.Client as unknown as jest.Mock).mockImplementation(() => ({
        userApi: {
            listUsers: mockListUsers,
        }
      }));

      // Re-create service
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          OktaService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();
      service = module.get<OktaService>(OktaService);

      const result = await service.collectUserAccessEvidence();

      expect(result.status).toBe('PASS');
      expect(result.data.activeUsers).toBe(1);
      expect(result.data.suspendedUsers).toBe(1);
      expect(result.data.deprovisionedUsers).toBe(1);
    });
  });
});
