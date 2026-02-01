/**
 * Queue names used throughout the application
 */
export enum QueueName {
  EVIDENCE_COLLECTION = 'evidence-collection',
  COMPLIANCE_CHECK = 'compliance-check',
  INTEGRATION_SYNC = 'integration-sync',
  JIRA_SYNC = 'jira-sync',
  NOTIFICATION = 'notification',
}

/**
 * Job types for evidence collection queue
 */
export enum EvidenceCollectionJobType {
  COLLECT_AWS = 'collect-aws',
  COLLECT_GITHUB = 'collect-github',
  COLLECT_OKTA = 'collect-okta',
}

/**
 * Job types for compliance check queue
 */
export enum ComplianceCheckJobType {
  RUN_CHECK = 'run-check',
  SCHEDULE_CHECKS = 'schedule-checks',
}

/**
 * Job types for integration sync queue
 */
export enum IntegrationSyncJobType {
  SYNC_INTEGRATION = 'sync-integration',
  HEALTH_CHECK = 'health-check',
}

/**
 * Job types for Jira sync queue
 */
export enum JiraSyncJobType {
  CREATE_TICKET = 'create-ticket',
  UPDATE_TICKET = 'update-ticket',
  SYNC_STATUS = 'sync-status',
}

/**
 * Job types for notification queue
 */
export enum NotificationJobType {
  SEND_SLACK = 'send-slack',
  SEND_EMAIL = 'send-email',
}
