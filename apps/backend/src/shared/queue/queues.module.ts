import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { QueueName } from './queue.constants';

/**
 * Evidence Collection Queue Module
 * Handles background jobs for collecting evidence from integrations
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.EVIDENCE_COLLECTION,
    }),
  ],
  exports: [BullModule],
})
export class EvidenceCollectionQueueModule {}

/**
 * Compliance Check Queue Module
 * Handles background jobs for running compliance checks
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.COMPLIANCE_CHECK,
    }),
  ],
  exports: [BullModule],
})
export class ComplianceCheckQueueModule {}

/**
 * Integration Sync Queue Module
 * Handles background jobs for syncing integrations
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.INTEGRATION_SYNC,
    }),
  ],
  exports: [BullModule],
})
export class IntegrationSyncQueueModule {}

/**
 * Jira Sync Queue Module
 * Handles background jobs for Jira ticket management
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.JIRA_SYNC,
    }),
  ],
  exports: [BullModule],
})
export class JiraSyncQueueModule {}

/**
 * Notification Queue Module
 * Handles background jobs for sending notifications
 */
@Module({
  imports: [
    BullModule.registerQueue({
      name: QueueName.NOTIFICATION,
    }),
  ],
  exports: [BullModule],
})
export class NotificationQueueModule {}
