import { render, screen } from '@/__tests__/utils/test-utils';
import { IntegrationHealth } from '@/components/dashboard/IntegrationHealth';
import { useDashboardStore } from '@/store/dashboard';
import type { IntegrationHealth as IntegrationHealthType } from '@/lib/api/types';

// Mock the dashboard store
jest.mock('@/store/dashboard');

const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;

describe('IntegrationHealth', () => {
  const mockFetchDashboardData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeletons for all integrations', () => {
      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: true,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('Integration Health')).toBeInTheDocument();
      expect(screen.getByText('Monitor the health of all connected integrations')).toBeInTheDocument();
      
      // Each integration card should show skeleton
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('Disconnected State', () => {
    it('should render disconnected state for all integrations when null', () => {
      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      const disconnectedBadges = screen.getAllByText('Disconnected');
      expect(disconnectedBadges).toHaveLength(5);

      const configMessages = screen.getAllByText('Configuration required');
      expect(configMessages).toHaveLength(5);
    });

    it('should render integration names even when disconnected', () => {
      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('AWS')).toBeInTheDocument();
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Okta')).toBeInTheDocument();
      expect(screen.getByText('Jira')).toBeInTheDocument();
      expect(screen.getByText('Slack')).toBeInTheDocument();
    });

    it('should show placeholder score for disconnected integrations', () => {
      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      const placeholders = screen.getAllByText('--%');
      expect(placeholders).toHaveLength(5);
    });
  });

  describe('Healthy Integration', () => {
    it('should render healthy AWS integration with correct status', () => {
      const healthyAws: IntegrationHealthType = {
        integration: 'aws',
        healthScore: 0.95,
        circuitBreaker: {
          state: 'CLOSED',
          failureCount: 0,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: healthyAws,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('AWS')).toBeInTheDocument();
      expect(screen.getByText('95%')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Circuit Breaker')).toBeInTheDocument();
      expect(screen.getByText('CLOSED')).toBeInTheDocument();
    });

    it('should show CLOSED circuit breaker icon for healthy integration', () => {
      const healthyGitHub: IntegrationHealthType = {
        integration: 'github',
        healthScore: 0.98,
        circuitBreaker: {
          state: 'CLOSED',
          failureCount: 0,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: healthyGitHub,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      // Check for CheckCircle2 icon by looking for text-success class
      const closedIcon = document.querySelector('.text-success');
      expect(closedIcon).toBeInTheDocument();
    });
  });

  describe('Degraded Integration', () => {
    it('should render degraded integration with warning status', () => {
      const degradedOkta: IntegrationHealthType = {
        integration: 'okta',
        healthScore: 0.75,
        circuitBreaker: {
          state: 'HALF_OPEN',
          failureCount: 2,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: null,
          okta: degradedOkta,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('Okta')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
      expect(screen.getByText('Degraded')).toBeInTheDocument();
      expect(screen.getByText('HALF_OPEN')).toBeInTheDocument();
    });

    it('should show failure count for degraded integration', () => {
      const degradedJira: IntegrationHealthType = {
        integration: 'jira',
        healthScore: 0.72,
        circuitBreaker: {
          state: 'HALF_OPEN',
          failureCount: 3,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: null,
          okta: null,
          jira: degradedJira,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('Failures')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });

  describe('Unhealthy Integration', () => {
    it('should render unhealthy integration with error status', () => {
      const unhealthySlack: IntegrationHealthType = {
        integration: 'slack',
        healthScore: 0.45,
        circuitBreaker: {
          state: 'OPEN',
          failureCount: 5,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: null,
          okta: null,
          jira: null,
          slack: unhealthySlack,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('Slack')).toBeInTheDocument();
      expect(screen.getByText('45%')).toBeInTheDocument();
      expect(screen.getByText('Unhealthy')).toBeInTheDocument();
      expect(screen.getByText('OPEN')).toBeInTheDocument();
    });

    it('should show OPEN circuit breaker icon for unhealthy integration', () => {
      const unhealthyAws: IntegrationHealthType = {
        integration: 'aws',
        healthScore: 0.30,
        circuitBreaker: {
          state: 'OPEN',
          failureCount: 10,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: unhealthyAws,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      // Check for XCircle icon by looking for text-error class
      const openIcon = document.querySelector('.text-error');
      expect(openIcon).toBeInTheDocument();
    });

    it('should show high failure count for unhealthy integration', () => {
      const unhealthyGitHub: IntegrationHealthType = {
        integration: 'github',
        healthScore: 0.20,
        circuitBreaker: {
          state: 'OPEN',
          failureCount: 15,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: null,
          github: unhealthyGitHub,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getByText('Failures')).toBeInTheDocument();
    });
  });

  describe('Mixed Health States', () => {
    it('should render multiple integrations with different health states', () => {
      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: {
            integration: 'aws',
            healthScore: 0.95,
            circuitBreaker: { state: 'CLOSED', failureCount: 0 },
            timestamp: new Date('2024-01-01'),
          },
          github: {
            integration: 'github',
            healthScore: 0.75,
            circuitBreaker: { state: 'HALF_OPEN', failureCount: 2 },
            timestamp: new Date('2024-01-01'),
          },
          okta: {
            integration: 'okta',
            healthScore: 0.45,
            circuitBreaker: { state: 'OPEN', failureCount: 8 },
            timestamp: new Date('2024-01-01'),
          },
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('Healthy')).toBeInTheDocument();
      expect(screen.getByText('Degraded')).toBeInTheDocument();
      expect(screen.getByText('Unhealthy')).toBeInTheDocument();
      expect(screen.getAllByText('Disconnected')).toHaveLength(2);
    });
  });

  describe('Edge Cases', () => {
    it('should not show failure count when failureCount is 0', () => {
      const healthyAws: IntegrationHealthType = {
        integration: 'aws',
        healthScore: 0.95,
        circuitBreaker: {
          state: 'CLOSED',
          failureCount: 0,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: healthyAws,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.queryByText('Failures')).not.toBeInTheDocument();
    });

    it('should handle 100% health score', () => {
      const perfectHealth: IntegrationHealthType = {
        integration: 'aws',
        healthScore: 1.0,
        circuitBreaker: {
          state: 'CLOSED',
          failureCount: 0,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: perfectHealth,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText('Healthy')).toBeInTheDocument();
    });

    it('should apply hover effect classes to connected integration cards', () => {
      const healthyAws: IntegrationHealthType = {
        integration: 'aws',
        healthScore: 0.95,
        circuitBreaker: {
          state: 'CLOSED',
          failureCount: 0,
        },
        timestamp: new Date('2024-01-01'),
      };

      mockUseDashboardStore.mockReturnValue({
        integrationHealth: {
          aws: healthyAws,
          github: null,
          okta: null,
          jira: null,
          slack: null,
        },
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<IntegrationHealth />);

      // Find the card element with hover classes
      const hoverCard = document.querySelector('.hover\\:shadow-lg');
      expect(hoverCard).toBeInTheDocument();
    });
  });
});
