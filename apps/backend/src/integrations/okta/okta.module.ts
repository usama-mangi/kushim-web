import { Module, forwardRef } from '@nestjs/common';
import { OktaService } from './okta.service';
import { OktaController } from './okta.controller';
import { IntegrationsManagementModule } from '../integrations.module';

@Module({
  imports: [forwardRef(() => IntegrationsManagementModule)],
  providers: [OktaService],
  controllers: [OktaController],
  exports: [OktaService],
})
export class OktaModule {}
