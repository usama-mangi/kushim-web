import { Module, Global } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { HealthController } from './health.controller';

@Global()
@Module({
  controllers: [HealthController],
  providers: [AlertsService],
  exports: [AlertsService],
})
export class MonitoringModule {}
