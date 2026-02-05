import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { SharedModule } from '../shared/shared.module';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [SharedModule, EmailModule, AuditModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
