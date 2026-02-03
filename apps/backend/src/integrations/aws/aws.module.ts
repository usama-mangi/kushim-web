import { Module, forwardRef } from '@nestjs/common';
import { AwsService } from './aws.service';
import { AwsController } from './aws.controller';
import { IntegrationsManagementModule } from '../integrations.module';

@Module({
  imports: [forwardRef(() => IntegrationsManagementModule)],
  providers: [AwsService],
  controllers: [AwsController],
  exports: [AwsService],
})
export class AwsModule {}
