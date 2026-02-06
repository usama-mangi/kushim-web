import { apiClient } from "./client";
import type {
  IntegrationHealth,
  OverallHealthResponse,
  EvidenceData,
  LoginResponse,
  RegisterResponse,
  User,
} from "./types";

/**
 * API endpoint functions
 */

// ============================================================================
// Authentication
// ============================================================================

export async function login(data: any): Promise<LoginResponse> {
  return apiClient.post<LoginResponse>("/auth/login", data);
}

export async function register(data: any): Promise<RegisterResponse> {
  return apiClient.post<RegisterResponse>("/auth/register", data);
}

export async function getMe(): Promise<User> {
  return apiClient.get<User>("/auth/me");
}

export async function forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>("/auth/forgot-password", { email });
}

// ============================================================================
// Compliance
// ============================================================================

export async function getControls(): Promise<any[]> {
  const response = await apiClient.get<{ data: any[]; pagination: any }>("/compliance/controls");
  return response.data || [];
}

export async function getControlDetails(id: string): Promise<any> {
  return apiClient.get<any>(`/compliance/controls/${id}`);
}

export async function getRecentAlerts(): Promise<any[]> {
  return apiClient.get<any[]>("/compliance/alerts");
}

export async function getComplianceTrends(): Promise<any[]> {
  return apiClient.get<any[]>("/compliance/trends");
}

export async function triggerComplianceScan(): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>("/compliance/scan");
}

// ============================================================================
// Reliability / Overall Health
// ============================================================================

export async function getOverallHealth(): Promise<OverallHealthResponse> {
  return apiClient.get<OverallHealthResponse>("/reliability/health");
}

export async function checkHealthAndAlert(): Promise<OverallHealthResponse & { alertsSent: number }> {
  return apiClient.post<OverallHealthResponse & { alertsSent: number }>(
    "/reliability/health/check-and-alert"
  );
}

// ============================================================================
// AWS Integration
// ============================================================================

export async function getAwsHealth(): Promise<IntegrationHealth> {
  return apiClient.get<IntegrationHealth>("/integrations/aws/health");
}

export async function collectAwsIamEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/aws/evidence/iam");
}

export async function collectAwsS3Evidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/aws/evidence/s3");
}

export async function collectAwsCloudTrailEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/aws/evidence/cloudtrail");
}

// ============================================================================
// GitHub Integration
// ============================================================================

export async function getGithubHealth(): Promise<IntegrationHealth> {
  return apiClient.get<IntegrationHealth>("/integrations/github/health");
}

export async function collectGithubBranchProtectionEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/github/evidence/branch-protection");
}

export async function collectGithubCommitSigningEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/github/evidence/commit-signing");
}

export async function collectGithubSecurityEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/github/evidence/security");
}

export async function getGithubRepos(): Promise<string[]> {
  return apiClient.get<string[]>("/integrations/github/repos");
}

export async function completeGithubSetup(repos: string[]): Promise<any> {
  return apiClient.post("/integrations/github/setup", { repos });
}

// ============================================================================
// Okta Integration
// ============================================================================

export async function getOktaHealth(): Promise<IntegrationHealth> {
  return apiClient.get<IntegrationHealth>("/integrations/okta/health");
}

export async function collectOktaMfaEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/okta/evidence/mfa");
}

export async function collectOktaUserAccessEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/okta/evidence/user-access");
}

export async function collectOktaPolicyEvidence(): Promise<EvidenceData> {
  return apiClient.post<EvidenceData>("/integrations/okta/evidence/policy");
}

// ============================================================================
// Jira Integration
// ============================================================================

export async function getJiraHealth(): Promise<IntegrationHealth> {
  return apiClient.get<IntegrationHealth>("/integrations/jira/health");
}

export async function testJiraConnection(): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>(
    "/integrations/jira/test-connection"
  );
}

// ============================================================================
// Slack Integration
// ============================================================================

export async function getSlackHealth(): Promise<IntegrationHealth> {
  return apiClient.get<IntegrationHealth>("/integrations/slack/health");
}

export async function testSlackConnection(): Promise<{ success: boolean; message: string }> {
  return apiClient.post<{ success: boolean; message: string }>(
    "/integrations/slack/test-connection"
  );
}

export async function sendSlackAlert(message: string): Promise<{ success: boolean }> {
  return apiClient.post<{ success: boolean }>("/integrations/slack/send-alert", { message });
}

export async function disconnectIntegrationByType(type: string): Promise<any> {
  return apiClient.delete(`/integrations/type/${type}`);
}
export async function getOAuthAuthorizeUrl(platform: string): Promise<{ url: string }> {
  return apiClient.get<{ url: string }>(`/integrations/oauth/${platform.toLowerCase()}/authorize`);
}

export async function connectIntegration(type: string, config: any): Promise<any> {
  return apiClient.post(`/integrations/${type.toLowerCase()}/connect`, config);
}

// ============================================================================
// AI Features
// ============================================================================

export async function getAIInsights(): Promise<any[]> {
  return apiClient.get<any[]>("/ai/insights");
}

export async function chatWithCopilot(data: { message: string; conversationId?: string }): Promise<any> {
  return apiClient.post("/ai/copilot/chat", data);
}

export async function mapEvidence(evidenceId: string): Promise<any> {
  return apiClient.post("/ai/evidence-mapping", { evidenceId });
}

export async function approveEvidenceMapping(mappingId: string): Promise<any> {
  return apiClient.post(`/ai/evidence-mapping/${mappingId}/approve`);
}

export async function generatePolicy(data: { policyType: string; controlIds: string[] }): Promise<any> {
  return apiClient.post("/ai/policy-drafting", data);
}

export async function reviewPolicy(policyId: string): Promise<any> {
  return apiClient.post(`/ai/policy-drafting/${policyId}/review`);
}

export async function getAIUsageStats(): Promise<any> {
  return apiClient.get("/ai/usage");
}

// ============================================================================
// Frameworks
// ============================================================================

export async function getFrameworks(): Promise<any[]> {
  return apiClient.get<any[]>("/frameworks");
}

export async function getFrameworkControls(framework: string): Promise<any[]> {
  return apiClient.get<any[]>(`/frameworks/${framework}/controls`);
}

export async function activateFramework(frameworkId: string): Promise<any> {
  return apiClient.post(`/frameworks/${frameworkId}/activate`);
}

// ============================================================================
// Policies
// ============================================================================

export async function getPolicies(): Promise<any[]> {
  return apiClient.get<any[]>("/policies");
}

export async function downloadPolicy(policyId: string, format: "pdf" | "docx" | "md"): Promise<Blob> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/policies/${policyId}/download?format=${format}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.blob();
}

// ============================================================================
// Audit Logs
// ============================================================================

export async function getAuditLogs(params?: { action?: string; dateRange?: string }): Promise<any[]> {
  const query = new URLSearchParams(params as any);
  return apiClient.get<any[]>(`/audit?${query}`);
}

export async function exportAuditLogs(params?: { action?: string; dateRange?: string }): Promise<Blob> {
  const query = new URLSearchParams(params as any);
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/audit/export?${query}`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return response.blob();
}

// ============================================================================
// User Settings
// ============================================================================

export async function updateUserProfile(data: { firstName: string; lastName: string; email: string }): Promise<any> {
  return apiClient.put("/users/profile", data);
}

export async function updateUserPreferences(data: any): Promise<any> {
  return apiClient.put("/users/preferences", data);
}

export async function getUserApiKeys(): Promise<any[]> {
  return apiClient.get<any[]>("/users/api-keys");
}

export async function createApiKey(name: string): Promise<any> {
  return apiClient.post("/users/api-keys", { name });
}

export async function deleteApiKey(keyId: string): Promise<any> {
  return apiClient.delete(`/users/api-keys/${keyId}`);
}
