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
      
      // Fetch individual integration health
      const [aws, github, okta, jira, slack] = await Promise.all([
        getAwsHealth().catch(() => null),
        getGithubHealth().catch(() => null),
        getOktaHealth().catch(() => null),
        getJiraHealth().catch(() => null),
        getSlackHealth().catch(() => null),
      ]);

      // Calculate compliance score from health metrics
      const totalIntegrations = healthResponse.metrics.totalIntegrations;
      const healthyCount = healthResponse.metrics.healthyIntegrations;
      const complianceScore: ComplianceScore = {
        overall: healthResponse.metrics.averageHealthScore,
        trend: "stable", // TODO: Calculate trend from historical data
        passingControls: healthyCount,
        failingControls: healthResponse.metrics.unhealthyIntegrations,
        warningControls: healthResponse.metrics.degradedIntegrations,
        totalControls: totalIntegrations,
      };

      set({
        overallHealth: healthResponse.metrics,
        integrationHealth: { aws, github, okta, jira, slack },
        complianceScore,
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
      const [aws, github, okta, jira, slack] = await Promise.all([
        getAwsHealth().catch(() => null),
        getGithubHealth().catch(() => null),
        getOktaHealth().catch(() => null),
        getJiraHealth().catch(() => null),
        getSlackHealth().catch(() => null),
      ]);

      set({
        integrationHealth: { aws, github, okta, jira, slack },
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
