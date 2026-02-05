import { render, screen, fireEvent, waitFor } from '@/__tests__/utils/test-utils';
import { ControlStatus } from '@/components/dashboard/ControlStatus';
import { useDashboardStore } from '@/store/dashboard';
import { triggerComplianceScan } from '@/lib/api/endpoints';
import { toast } from 'sonner';
import type { Control } from '@/lib/api/types';

// Mock the dashboard store
jest.mock('@/store/dashboard');

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

// Mock API endpoints
jest.mock('@/lib/api/endpoints', () => ({
  triggerComplianceScan: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;
const mockTriggerComplianceScan = triggerComplianceScan as jest.MockedFunction<typeof triggerComplianceScan>;

describe('ControlStatus', () => {
  const mockFetchDashboardData = jest.fn();

  const mockControls: Control[] = [
    {
      id: 'ctrl-1',
      name: 'MFA Enforcement',
      description: 'Ensure MFA is enabled for all users',
      category: 'Access Control',
      status: 'PASS',
      lastCheck: new Date('2024-01-01T10:00:00Z'),
      nextCheck: new Date('2024-01-02T10:00:00Z'),
      frequency: 'DAILY',
      integration: 'AWS',
    },
    {
      id: 'ctrl-2',
      name: 'Encryption at Rest',
      description: 'Verify all S3 buckets have encryption enabled',
      category: 'Data Protection',
      status: 'FAIL',
      lastCheck: new Date('2024-01-01T11:00:00Z'),
      nextCheck: new Date('2024-01-02T11:00:00Z'),
      frequency: 'DAILY',
      integration: 'AWS',
    },
    {
      id: 'ctrl-3',
      name: 'Code Review',
      description: 'All PRs must be reviewed before merge',
      category: 'Change Management',
      status: 'WARNING',
      lastCheck: new Date('2024-01-01T09:00:00Z'),
      nextCheck: new Date('2024-01-02T09:00:00Z'),
      frequency: 'HOURLY',
      integration: 'GitHub',
    },
    {
      id: 'ctrl-4',
      name: 'Password Complexity',
      description: 'Enforce strong password policies',
      category: 'Access Control',
      status: 'PENDING',
      lastCheck: new Date('2024-01-01T08:00:00Z'),
      nextCheck: new Date('2024-01-02T08:00:00Z'),
      frequency: 'WEEKLY',
      integration: 'Okta',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeletons when isLoading is true and no controls', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: [],
        isLoading: true,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getByText('Control Status')).toBeInTheDocument();
      expect(screen.getByText('Monitor SOC 2 controls and their compliance status')).toBeInTheDocument();
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBe(5);
    });

    it('should call fetchDashboardData on mount when controls are empty', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: [],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(mockFetchDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success State', () => {
    it('should render all controls in the table', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getByText('MFA Enforcement')).toBeInTheDocument();
      expect(screen.getByText('Encryption at Rest')).toBeInTheDocument();
      expect(screen.getByText('Code Review')).toBeInTheDocument();
      expect(screen.getByText('Password Complexity')).toBeInTheDocument();
    });

    it('should render control descriptions', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getByText('Ensure MFA is enabled for all users')).toBeInTheDocument();
      expect(screen.getByText('Verify all S3 buckets have encryption enabled')).toBeInTheDocument();
    });

    it('should render integration badges for each control', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getAllByText('AWS')).toHaveLength(2);
      expect(screen.getByText('GitHub')).toBeInTheDocument();
      expect(screen.getByText('Okta')).toBeInTheDocument();
    });

    it('should render status badges with correct statuses', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getByText('PASS')).toBeInTheDocument();
      expect(screen.getByText('FAIL')).toBeInTheDocument();
      expect(screen.getByText('WARNING')).toBeInTheDocument();
      expect(screen.getByText('PENDING')).toBeInTheDocument();
    });

    it('should render view buttons for each control', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const links = document.querySelectorAll('a[href^="/controls/"]');
      expect(links).toHaveLength(4);
    });
  });

  describe('Search Functionality', () => {
    it('should filter controls by name', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const searchInput = screen.getByPlaceholderText('Search controls...');
      fireEvent.change(searchInput, { target: { value: 'MFA' } });

      expect(screen.getByText('MFA Enforcement')).toBeInTheDocument();
      expect(screen.queryByText('Encryption at Rest')).not.toBeInTheDocument();
      expect(screen.queryByText('Code Review')).not.toBeInTheDocument();
    });

    it('should filter controls by description', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const searchInput = screen.getByPlaceholderText('Search controls...');
      fireEvent.change(searchInput, { target: { value: 'S3 buckets' } });

      expect(screen.getByText('Encryption at Rest')).toBeInTheDocument();
      expect(screen.queryByText('MFA Enforcement')).not.toBeInTheDocument();
    });

    it('should be case-insensitive', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const searchInput = screen.getByPlaceholderText('Search controls...');
      fireEvent.change(searchInput, { target: { value: 'code review' } });

      expect(screen.getByText('Code Review')).toBeInTheDocument();
    });

    it('should show no results message when search matches nothing', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const searchInput = screen.getByPlaceholderText('Search controls...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No controls found matching your filters.')).toBeInTheDocument();
    });
  });

  describe('Status Filter', () => {
    it('should render status filter dropdown', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const filterSelect = screen.getByRole('combobox');
      expect(filterSelect).toBeInTheDocument();
    });

    it('should show all controls when filter is set to ALL', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      // By default, all controls should be visible
      expect(screen.getByText('MFA Enforcement')).toBeInTheDocument();
      expect(screen.getByText('Encryption at Rest')).toBeInTheDocument();
      expect(screen.getByText('Code Review')).toBeInTheDocument();
      expect(screen.getByText('Password Complexity')).toBeInTheDocument();
    });
  });

  describe('Scan Now Button', () => {
    it('should render scan now button', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getByText('Scan Now')).toBeInTheDocument();
    });

    it('should trigger compliance scan on button click', async () => {
      mockTriggerComplianceScan.mockResolvedValueOnce(undefined);
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const scanButton = screen.getByText('Scan Now');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(mockTriggerComplianceScan).toHaveBeenCalledTimes(1);
      });
    });

    it('should show success toast when scan starts successfully', async () => {
      mockTriggerComplianceScan.mockResolvedValueOnce(undefined);
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const scanButton = screen.getByText('Scan Now');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Compliance scan started');
      });
    });

    it('should show error toast when scan fails', async () => {
      mockTriggerComplianceScan.mockRejectedValueOnce(new Error('Scan failed'));
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const scanButton = screen.getByText('Scan Now');
      fireEvent.click(scanButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to start compliance scan');
      });
    });

    it('should disable button during scan', async () => {
      mockTriggerComplianceScan.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const scanButton = screen.getByText('Scan Now').closest('button');
      fireEvent.click(scanButton!);

      expect(scanButton).toBeDisabled();
    });

    it('should be disabled when isLoading is true', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: true,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      const scanButton = screen.getByText('Scan Now').closest('button');
      expect(scanButton).toBeDisabled();
    });
  });

  describe('Empty State', () => {
    it('should show message when no controls match filters', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: [],
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getByText('No controls found matching your filters.')).toBeInTheDocument();
    });
  });

  describe('Table Headers', () => {
    it('should render all table headers', () => {
      mockUseDashboardStore.mockReturnValue({
        controls: mockControls,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ControlStatus />);

      expect(screen.getByText('Control')).toBeInTheDocument();
      expect(screen.getByText('Integration')).toBeInTheDocument();
      expect(screen.getByText('Last Check')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });
});
