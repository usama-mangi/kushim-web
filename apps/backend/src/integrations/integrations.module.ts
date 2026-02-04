import { Module } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { IntegrationsController } from './integrations.controller';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { OAuthService } from './oauth/oauth.service';
import { OAuthController } from './oauth/oauth.controller';

@Module({
  imports: [PrismaModule],
  providers: [IntegrationsService, OAuthService],
  controllers: [IntegrationsController, OAuthController],
  exports: [IntegrationsService, OAuthService],
})
export class IntegrationsManagementModule {}
