import { render, screen, waitFor } from '@/__tests__/utils/test-utils';
import { ComplianceScore } from '@/components/dashboard/ComplianceScore';
import { useDashboardStore } from '@/store/dashboard';
import type { ComplianceScore as ComplianceScoreType } from '@/lib/api/types';

// Mock the dashboard store
jest.mock('@/store/dashboard');

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>;
  };
});

const mockUseDashboardStore = useDashboardStore as jest.MockedFunction<typeof useDashboardStore>;

describe('ComplianceScore', () => {
  const mockFetchDashboardData = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should render loading skeleton when isLoading is true', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: null,
        isLoading: true,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('Compliance Score')).toBeInTheDocument();
      expect(screen.getByText('Overall compliance health')).toBeInTheDocument();
      // Check for skeleton elements
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render loading skeleton when complianceScore is null', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: null,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should call fetchDashboardData on mount when complianceScore is null', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: null,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(mockFetchDashboardData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Success State - High Score', () => {
    const highScore: ComplianceScoreType = {
      overall: 0.95,
      trend: 'up',
      passingControls: 61,
      failingControls: 1,
      warningControls: 2,
      totalControls: 64,
    };

    it('should render high compliance score with success color', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: highScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      const scoreElement = screen.getByText('95%');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveClass('text-success');
    });

    it('should render upward trending icon', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: highScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('up')).toBeInTheDocument();
      // Check for TrendingUp icon by checking for success text color
      const trendIcon = document.querySelector('.text-success');
      expect(trendIcon).toBeInTheDocument();
    });

    it('should display control breakdown correctly', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: highScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('61')).toBeInTheDocument();
      expect(screen.getByText('Passing')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('Warning')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('Failing')).toBeInTheDocument();
    });

    it('should display total controls', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: highScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('Total Controls')).toBeInTheDocument();
      expect(screen.getByText('64')).toBeInTheDocument();
    });

    it('should not show CTA button when controls exist', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: highScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.queryByText('Connect Integrations')).not.toBeInTheDocument();
    });
  });

  describe('Success State - Medium Score', () => {
    const mediumScore: ComplianceScoreType = {
      overall: 0.75,
      trend: 'stable',
      passingControls: 48,
      failingControls: 8,
      warningControls: 8,
      totalControls: 64,
    };

    it('should render medium compliance score with warning color', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: mediumScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      const scoreElement = screen.getByText('75%');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveClass('text-warning');
    });

    it('should render stable trend icon', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: mediumScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('stable')).toBeInTheDocument();
    });
  });

  describe('Success State - Low Score', () => {
    const lowScore: ComplianceScoreType = {
      overall: 0.45,
      trend: 'down',
      passingControls: 29,
      failingControls: 20,
      warningControls: 15,
      totalControls: 64,
    };

    it('should render low compliance score with error color', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: lowScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      const scoreElement = screen.getByText('45%');
      expect(scoreElement).toBeInTheDocument();
      expect(scoreElement).toHaveClass('text-error');
    });

    it('should render downward trending icon', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: lowScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('down')).toBeInTheDocument();
    });
  });

  describe('CTA Button', () => {
    const emptyScore: ComplianceScoreType = {
      overall: 0,
      trend: 'stable',
      passingControls: 0,
      failingControls: 0,
      warningControls: 0,
      totalControls: 64,
    };

    it('should show "Connect Integrations" button when no controls have results', () => {
      mockUseDashboardStore.mockReturnValue({
        complianceScore: emptyScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      const button = screen.getByText('Connect Integrations');
      expect(button).toBeInTheDocument();
      
      const link = button.closest('a');
      expect(link).toHaveAttribute('href', '/integrations');
    });

    it('should not show CTA button when at least one control has a result', () => {
      const scoreWithResults: ComplianceScoreType = {
        overall: 0.01,
        trend: 'stable',
        passingControls: 1,
        failingControls: 0,
        warningControls: 0,
        totalControls: 64,
      };

      mockUseDashboardStore.mockReturnValue({
        complianceScore: scoreWithResults,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.queryByText('Connect Integrations')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle 100% compliance score', () => {
      const perfectScore: ComplianceScoreType = {
        overall: 1.0,
        trend: 'up',
        passingControls: 64,
        failingControls: 0,
        warningControls: 0,
        totalControls: 64,
      };

      mockUseDashboardStore.mockReturnValue({
        complianceScore: perfectScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });

    it('should handle 0% compliance score', () => {
      const zeroScore: ComplianceScoreType = {
        overall: 0,
        trend: 'down',
        passingControls: 0,
        failingControls: 64,
        warningControls: 0,
        totalControls: 64,
      };

      mockUseDashboardStore.mockReturnValue({
        complianceScore: zeroScore,
        isLoading: false,
        fetchDashboardData: mockFetchDashboardData,
      } as any);

      render(<ComplianceScore />);

      expect(screen.getByText('0%')).toBeInTheDocument();
    });
  });
});
