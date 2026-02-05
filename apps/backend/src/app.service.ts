import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';
import {
  QueueName,
  EvidenceCollectionJobType,
} from './shared/queue/queue.constants';

@Injectable()
export class AppService {
  private readonly logger = new Logger(AppService.name);

  constructor(
    @InjectQueue(QueueName.EVIDENCE_COLLECTION)
    private evidenceQueue: Queue,
  ) {}

  getHello(): string {
    return 'Kushim API - Compliance Automation Platform';
  }

  /**
   * Example method to demonstrate queue usage
   * This will be used by integration services in Week 3-4
   */
  async queueEvidenceCollection(
    customerId: string,
    integrationId: string,
    controlId: string,
    type: EvidenceCollectionJobType,
  ) {
    const job = await this.evidenceQueue.add(type, {
      customerId,
      integrationId,
      controlId,
      type,
    });

    this.logger.log(
      `Queued evidence collection job ${job.id} for customer ${customerId}`,
    );
    return { jobId: job.id };
  }
}
