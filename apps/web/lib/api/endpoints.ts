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
