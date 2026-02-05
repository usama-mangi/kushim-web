import { render, screen } from '@/__tests__/utils/test-utils';
import { RecentAlerts } from '@/components/dashboard/RecentAlerts';
import { useDashboardStore } from '@/store/dashboard';
import type { Alert } from '@/lib/api/types';

// Mock the dashboard store
jest.mock('@/store/dashboard');

const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;

describe('RecentAlerts', () => {
  const mockFetchDashboardData = jest.fn();

  const mockAlerts: Alert[] = [
    {
      id: 'alert-1',
      severity: 'critical',
      message: 'MFA not enabled for 5 users',
      timestamp: new Date('2024-01-01T10:00:00Z'),
      controlId: 'ctrl-1',
      controlName: 'MFA Enforcement',
      jiraTicketUrl: 'https://jira.example.com/browse/SEC-123',
      acknowledged: false,
    },
    {
      id: 'alert-2',
      severity: 'warning',
      message: 'S3 bucket encryption not enabled',
      timestamp: new Date('2024-01-01T09:00:00Z'),
      controlId: 'ctrl-2',
      controlName: 'Encryption at Rest',
      jiraTicketUrl: 'https://jira.example.com/browse/SEC-124',
      acknowledged: false,
    },
    {
      id: 'alert-3',
      severity: 'info',
      message: 'New compliance framework available',
      timestamp: new Date('2024-01-01T08:00:00Z'),
      acknowledged: false,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeletons when isLoading is true and no alerts', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [],
        isLoading: true,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('Recent Alerts')).toBeInTheDocument();
      expect(screen.getByText('Latest compliance issues and notifications')).toBeInTheDocument();
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(3);
    });

    it('should call fetchDashboardData on mount when alerts are empty', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(mockFetchDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no alerts after loading', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('No recent alerts')).toBeInTheDocument();
    });

    it('should render info icon in empty state', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      const emptyIcon = document.querySelector('.opacity-50');
      expect(emptyIcon).toBeInTheDocument();
    });
  });

  describe('Alert Rendering', () => {
    it('should render all alerts', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: mockAlerts,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('MFA not enabled for 5 users')).toBeInTheDocument();
      expect(screen.getByText('S3 bucket encryption not enabled')).toBeInTheDocument();
      expect(screen.getByText('New compliance framework available')).toBeInTheDocument();
    });

    it('should render alert timestamps', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: mockAlerts,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      // Check that relative time elements exist
      const timestamps = document.querySelectorAll('.whitespace-nowrap');
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('Critical Severity', () => {
    it('should render critical alert with error icon', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[0]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('MFA not enabled for 5 users')).toBeInTheDocument();
      
      // Check for error color class
      const errorIcon = document.querySelector('.text-error');
      expect(errorIcon).toBeInTheDocument();
    });

    it('should apply critical background styling', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[0]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      // The outer div with the alert.id key has the background class
      const alertContainer = document.querySelector('[class*="bg-red"]');
      expect(alertContainer).toBeInTheDocument();
      expect(screen.getByText('MFA not enabled for 5 users')).toBeInTheDocument();
    });

    it('should display control name for critical alert', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[0]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('Control:')).toBeInTheDocument();
      expect(screen.getByText('MFA Enforcement')).toBeInTheDocument();
    });

    it('should display Jira ticket link for critical alert', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[0]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      const jiraLink = screen.getByText('View Jira Ticket').closest('a');
      expect(jiraLink).toHaveAttribute('href', 'https://jira.example.com/browse/SEC-123');
      expect(jiraLink).toHaveAttribute('target', '_blank');
      expect(jiraLink).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('Warning Severity', () => {
    it('should render warning alert with warning icon', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[1]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('S3 bucket encryption not enabled')).toBeInTheDocument();
      
      // Check for warning color class
      const warningIcon = document.querySelector('.text-warning');
      expect(warningIcon).toBeInTheDocument();
    });

    it('should display control name for warning alert', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[1]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('Encryption at Rest')).toBeInTheDocument();
    });

    it('should display Jira ticket link for warning alert', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[1]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      const jiraLink = screen.getByText('View Jira Ticket').closest('a');
      expect(jiraLink).toHaveAttribute('href', 'https://jira.example.com/browse/SEC-124');
    });
  });

  describe('Info Severity', () => {
    it('should render info alert with info icon', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[2]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('New compliance framework available')).toBeInTheDocument();
      
      // Check for blue color class
      const infoIcon = document.querySelector('.text-blue-500');
      expect(infoIcon).toBeInTheDocument();
    });

    it('should not display control name when not provided', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[2]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.queryByText('Control:')).not.toBeInTheDocument();
    });

    it('should not display Jira ticket link when not provided', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[2]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.queryByText('View Jira Ticket')).not.toBeInTheDocument();
    });
  });

  describe('Multiple Alerts', () => {
    it('should render multiple alerts with different severities', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: mockAlerts,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      // Should have all three alerts
      expect(screen.getByText('MFA not enabled for 5 users')).toBeInTheDocument();
      expect(screen.getByText('S3 bucket encryption not enabled')).toBeInTheDocument();
      expect(screen.getByText('New compliance framework available')).toBeInTheDocument();
    });

    it('should render correct number of Jira ticket links', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: mockAlerts,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      const jiraLinks = screen.getAllByText('View Jira Ticket');
      expect(jiraLinks).toHaveLength(2);
    });
  });

  describe('Scrollable Container', () => {
    it('should have scrollable content area with custom scrollbar', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: mockAlerts,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      const scrollContainer = document.querySelector('.overflow-auto');
      expect(scrollContainer).toBeInTheDocument();
      expect(scrollContainer?.className).toContain('custom-scrollbar');
    });

    it('should have fixed height container', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: mockAlerts,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      const card = document.querySelector('.h-\\[500px\\]');
      expect(card).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle alert without controlId', () => {
      const alertWithoutControl: Alert = {
        id: 'alert-4',
        severity: 'warning',
        message: 'System maintenance scheduled',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        acknowledged: false,
      };

      mockUseDashboardStore.mockReturnValue({
        alerts: [alertWithoutControl],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('System maintenance scheduled')).toBeInTheDocument();
      expect(screen.queryByText('Control:')).not.toBeInTheDocument();
    });

    it('should handle very long alert messages', () => {
      const longAlert: Alert = {
        id: 'alert-5',
        severity: 'critical',
        message: 'This is a very long alert message that should still be displayed correctly and not break the layout or cause any rendering issues',
        timestamp: new Date('2024-01-01T10:00:00Z'),
        acknowledged: false,
      };

      mockUseDashboardStore.mockReturnValue({
        alerts: [longAlert],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText(/This is a very long alert message/)).toBeInTheDocument();
    });

    it('should handle single alert', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: [mockAlerts[0]],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      expect(screen.getByText('MFA not enabled for 5 users')).toBeInTheDocument();
      expect(screen.queryByText('S3 bucket encryption not enabled')).not.toBeInTheDocument();
    });

    it('should not call fetchDashboardData if alerts already exist', () => {
      mockUseDashboardStore.mockReturnValue({
        alerts: mockAlerts,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<RecentAlerts />);

      // Should not call fetchDashboardData since alerts.length > 0
      expect(mockFetchDashboardData).not.toHaveBeenCalled();
    });
  });
});
