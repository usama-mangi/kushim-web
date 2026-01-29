import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { Neo4jModule } from './neo4j/neo4j.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { RecordsModule } from './records/records.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { ActionsModule } from './actions/actions.module';
import { AuditInterceptor } from './audit/audit.interceptor';
import { CommonModule } from './common/common.module';
import { RedisThrottlerStorage } from './common/throttler-storage';
import { WebhookModule } from './webhooks/webhook.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    UsersModule,
    PrismaModule,
    Neo4jModule,
    IngestionModule,
    RecordsModule,
    NotificationsModule,
    AuditModule,
    ActionsModule,
    WebhookModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000,
          limit: 100,
        },
      ],
      storage: new RedisThrottlerStorage(),
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
