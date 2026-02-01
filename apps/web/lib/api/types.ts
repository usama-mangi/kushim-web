/**
 * TypeScript interfaces for API responses
 */

export type IntegrationStatus = "PASS" | "FAIL" | "WARNING" | "PENDING";

export interface CircuitBreakerStatus {
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
  failureCount: number;
}

export interface IntegrationHealth {
  integration: string;
  healthScore: number;
  circuitBreaker: CircuitBreakerStatus;
  timestamp: Date;
}

export interface OverallHealthMetrics {
  totalIntegrations: number;
  healthyIntegrations: number;
  degradedIntegrations: number;
  unhealthyIntegrations: number;
  averageHealthScore: number;
  integrations: {
    [key: string]: {
      healthScore: number;
      status: "healthy" | "degraded" | "unhealthy";
      circuitBreaker: CircuitBreakerStatus;
    };
  };
}

export interface OverallHealthResponse {
  status: string;
  timestamp: Date;
  metrics: OverallHealthMetrics;
}

export interface EvidenceData {
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  status: IntegrationStatus;
}

export interface ComplianceScore {
  overall: number;
  trend: "up" | "down" | "stable";
  passingControls: number;
  failingControls: number;
  warningControls: number;
  totalControls: number;
}

export interface Control {
  id: string;
  name: string;
  description: string;
  category: string;
  status: IntegrationStatus;
  lastCheck: Date;
  nextCheck: Date;
  frequency: string;
  integration: string;
}

export interface Alert {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  timestamp: Date;
  controlId?: string;
  controlName?: string;
  jiraTicketUrl?: string;
  acknowledged: boolean;
}

export interface Evidence {
  id: string;
  controlId: string;
  timestamp: string;
  type: string;
  source: string;
  data: any;
  hash: string;
}

export interface JiraTask {
  id: string;
  ticketKey: string;
  ticketUrl: string;
  controlId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiError {
  message: string;
  statusCode: number;
  error?: string;
}
