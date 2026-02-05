import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SharedModule } from '../shared/shared.module';
import { JwtStrategy } from './jwt.strategy';
import { EmailModule } from '../email/email.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    SharedModule,
    EmailModule,
    AuditModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super-secret',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
