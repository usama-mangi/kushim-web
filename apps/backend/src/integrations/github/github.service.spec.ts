import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GitHubService } from './github.service';
import { Octokit } from '@octokit/rest';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'GITHUB_TOKEN') return 'test-token';
    return null;
  }),
};

// Mock Octokit
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => {
      return {
        users: {
          getAuthenticated: jest.fn(),
        },
        repos: {
            listBranches: jest.fn(),
            getBranchProtection: jest.fn(),
            listCommits: jest.fn(),
            get: jest.fn(),
            checkVulnerabilityAlerts: jest.fn(),
        }
      };
    }),
  };
});

describe('GitHubService', () => {
  let service: GitHubService;
  let mockOctokit: any;

  beforeEach(async () => {
    // Clear mocks
    // (Octokit as unknown as jest.Mock).mockClear();
    
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GitHubService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<GitHubService>(GitHubService);
    
    // Access the mocked Octokit instance from the service
    // Since it's a private property created in constructor, we might need to rely on the mock implementation 
    // being consistent or check how we can spy on it.
    // However, since we mock the module, any new Octokit() will use our mock
    
    // To control the mock responses per test, we need access to the methods.
    // The service creates a new Octokit instance.
    // We can get the mock class:
    // mockOctokit = (Octokit as unknown as jest.Mock).mock.instances[0]; 
    // Wait, the service creates 'defaultOctokit' in constructor. 
    // And getOctokit creates new ones if token provided.
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('collectBranchProtectionEvidence', () => {
    it('should return PASS when main branch is protected', async () => {
      const mockListBranches = jest.fn().mockResolvedValue({
        data: [{ name: 'main' }]
      });
      const mockGetBranchProtection = jest.fn().mockResolvedValue({
        data: {
          required_pull_request_reviews: { required_approving_review_count: 1 },
          required_signatures: { enabled: true },
          enforce_admins: { enabled: true }
        }
      });
      
      // We need to inject these mocks into the Octokit instance used by the service
      (Octokit as unknown as jest.Mock).mockImplementation(() => ({
          repos: {
              listBranches: mockListBranches,
              getBranchProtection: mockGetBranchProtection,
          }
      }));

      // Re-create service to pick up the new mock implementation
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GitHubService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();
      service = module.get<GitHubService>(GitHubService);

      const result = await service.collectBranchProtectionEvidence('owner', 'repo');
      
      expect(result.status).toBe('PASS');
      expect(result.data.complianceRate).toBe(1);
    });
  });

  describe('collectCommitSigningEvidence', () => {
    it('should return PASS when commits are signed', async () => {
      const mockListCommits = jest.fn().mockResolvedValue({
        data: [
            { 
               sha: '123', 
               commit: { 
                   message: 'test', 
                   verification: { verified: true },
                   author: { name: 'dev', date: new Date().toISOString() }
               } 
            }
        ]
      });
      
      (Octokit as unknown as jest.Mock).mockImplementation(() => ({
          repos: {
              listCommits: mockListCommits,
          }
      }));

      // Re-create service
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          GitHubService,
          {
            provide: ConfigService,
            useValue: mockConfigService,
          },
        ],
      }).compile();
      service = module.get<GitHubService>(GitHubService);

      const result = await service.collectCommitSigningEvidence('owner', 'repo');
      
      expect(result.status).toBe('PASS');
      expect(result.data.signingRate).toBe(1);
    });
  });
});
