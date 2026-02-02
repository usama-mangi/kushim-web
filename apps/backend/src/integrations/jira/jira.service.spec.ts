import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JiraService } from './jira.service';
import axios from 'axios';

// Mock ConfigService
const mockConfigService = {
  get: jest.fn((key: string) => {
    if (key === 'JIRA_DOMAIN') return 'test.atlassian.net';
    if (key === 'JIRA_EMAIL') return 'test@example.com';
    if (key === 'JIRA_API_TOKEN') return 'test-token';
    return null;
  }),
};

// Mock Axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('JiraService', () => {
  let service: JiraService;
  let mockAxiosInstance: any;

  beforeEach(async () => {
    // Setup Mock Axios Instance
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JiraService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<JiraService>(JiraService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRemediationTicket', () => {
    it('should create a ticket successfully', async () => {
      mockAxiosInstance.post.mockResolvedValue({
        data: {
          id: '1001',
          key: 'PROJ-1',
          self: 'http://test.atlassian.net/rest/api/3/issue/1001'
        }
      });

      const result = await service.createRemediationTicket({
        controlId: 'CC6.1',
        controlTitle: 'MFA',
        failureReason: 'User missing MFA',
        evidenceId: 'ev-1',
        projectKey: 'PROJ'
      });

      expect(result.status).toBe('SUCCESS');
      expect(result.data.issueKey).toBe('PROJ-1');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issue', expect.objectContaining({
          fields: expect.objectContaining({
              project: { key: 'PROJ' },
              labels: expect.arrayContaining(['compliance', 'automated', 'CC6.1'])
          })
      }));
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status successfully', async () => {
      // Mock transitions response
      mockAxiosInstance.get.mockResolvedValue({
          data: {
              transitions: [
                  { id: '21', name: 'In Progress' },
                  { id: '31', name: 'Done' }
              ]
          }
      });
      // Mock update response
      mockAxiosInstance.post.mockResolvedValue({});

      const result = await service.updateTicketStatus('PROJ-1', 'Done');

      expect(result.status).toBe('SUCCESS');
      expect(result.data.newStatus).toBe('Done');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/issue/PROJ-1/transitions', {
          transition: { id: '31' }
      });
    });

    it('should throw error if transition not found', async () => {
        mockAxiosInstance.get.mockResolvedValue({
            data: {
                transitions: [{ id: '21', name: 'In Progress' }]
            }
        });
  
        await expect(service.updateTicketStatus('PROJ-1', 'UnknownStatus'))
          .rejects.toThrow('Transition to status "UnknownStatus" not found');
    });
  });

  describe('syncTicketStatus', () => {
      it('should return ticket details', async () => {
          mockAxiosInstance.get.mockResolvedValue({
              data: {
                  id: '1001',
                  key: 'PROJ-1',
                  fields: {
                      summary: 'Test Issue',
                      status: { name: 'Done' },
                      assignee: { displayName: 'John Doe' }
                  }
              }
          });

          const result = await service.syncTicketStatus('PROJ-1');

          expect(result.status).toBe('SUCCESS');
          expect(result.data.status).toBe('Done');
          expect(result.data.assignee).toBe('John Doe');
      });
  });

});
