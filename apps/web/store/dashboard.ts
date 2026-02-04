import { create } from "zustand";
import type {
  IntegrationHealth,
  OverallHealthMetrics,
  ComplianceScore,
  Control,
  Alert,
} from "../lib/api/types";
import {
  getOverallHealth,
  getAwsHealth,
  getGithubHealth,
  getOktaHealth,
  getJiraHealth,
  getSlackHealth,
  getControls,
  getRecentAlerts,
  getComplianceTrends,
} from "../lib/api/endpoints";

interface DashboardState {
  // Data
  overallHealth: OverallHealthMetrics | null;
  integrationHealth: {
    aws: IntegrationHealth | null;
    github: IntegrationHealth | null;
    okta: IntegrationHealth | null;
    jira: IntegrationHealth | null;
    slack: IntegrationHealth | null;
  };
  complianceScore: ComplianceScore | null;
  trends: any[];
  controls: Control[];
  alerts: Alert[];

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;

  // Error states
  error: string | null;

  // Auto-refresh
  lastRefresh: Date | null;
  refreshInterval: number; // milliseconds

  // Actions
  fetchDashboardData: () => Promise<void>;
  fetchIntegrationHealth: () => Promise<void>;
  setRefreshInterval: (interval: number) => void;
  clearError: () => void;
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  overallHealth: null,
  integrationHealth: {
    aws: null,
    github: null,
    okta: null,
    jira: null,
    slack: null,
  },
  complianceScore: null,
  trends: [],
  controls: [],
  alerts: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  lastRefresh: null,
  refreshInterval: 15 * 60 * 1000, // 15 minutes

  // Fetch all dashboard data
  fetchDashboardData: async () => {
    const state = get();
    set({ isLoading: !state.lastRefresh, isRefreshing: !!state.lastRefresh, error: null });

    try {
      // Fetch overall health
      const healthResponse = await getOverallHealth();
      
      // Fetch controls, alerts, and trends
      const [controls, alerts, trends] = await Promise.all([
        getControls().catch(() => []),
        getRecentAlerts().catch(() => []),
        getComplianceTrends().catch(() => []),
      ]);

      // Derive individual integration health from the overall metrics
      const getHealthFor = (key: string): IntegrationHealth | null => {
        const data = healthResponse.metrics.integrations[key];
        if (!data) return null;
        return {
          integration: key,
          healthScore: data.healthScore,
          circuitBreaker: data.circuitBreaker,
          timestamp: new Date(healthResponse.timestamp),
        };
      };

      const aws = getHealthFor('aws');
      const github = getHealthFor('github');
      const okta = getHealthFor('okta');
      const jira = getHealthFor('jira');
      const slack = getHealthFor('slack');

      // Calculate compliance score from actual controls
      const totalControls = controls.length || 64; // Fallback to 64 if not loaded
      const passingControls = controls.filter(c => c.status === 'PASS').length;
      const failingControls = controls.filter(c => c.status === 'FAIL').length;
      const warningControls = controls.filter(c => c.status === 'WARNING' || c.status === 'PENDING').length;
      
      const overall = totalControls > 0 ? passingControls / totalControls : 0;

      const complianceScore: ComplianceScore = {
        overall,
        trend: "stable", 
        passingControls,
        failingControls,
        warningControls,
        totalControls,
      };

      set({
        overallHealth: healthResponse.metrics,
        integrationHealth: { aws, github, okta, jira, slack },
        complianceScore,
        trends: trends || [],
        controls: controls || [],
        alerts: alerts || [],
        lastRefresh: new Date(),
        isLoading: false,
        isRefreshing: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch dashboard data",
        isLoading: false,
        isRefreshing: false,
      });
    }
  },

  // Fetch integration health only
  fetchIntegrationHealth: async () => {
    set({ isRefreshing: true, error: null });

    try {
      const healthResponse = await getOverallHealth();
      
      const getHealthFor = (key: string): IntegrationHealth | null => {
        const data = healthResponse.metrics.integrations[key];
        if (!data) return null;
        return {
          integration: key,
          healthScore: data.healthScore,
          circuitBreaker: data.circuitBreaker,
          timestamp: new Date(healthResponse.timestamp),
        };
      };

      set({
        integrationHealth: {
          aws: getHealthFor('aws'),
          github: getHealthFor('github'),
          okta: getHealthFor('okta'),
          jira: getHealthFor('jira'),
          slack: getHealthFor('slack'),
        },
        isRefreshing: false,
      });
    } catch (error: any) {
      set({
        error: error.message || "Failed to fetch integration health",
        isRefreshing: false,
      });
    }
  },

  // Set refresh interval
  setRefreshInterval: (interval: number) => {
    set({ refreshInterval: interval });
  },

  // Clear error
  clearError: () => {
    set({ error: null });
  },
}));
