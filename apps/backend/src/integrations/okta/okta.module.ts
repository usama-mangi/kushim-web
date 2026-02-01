import { Module } from '@nestjs/common';
import { OktaService } from './okta.service';
import { OktaController } from './okta.controller';

@Module({
  providers: [OktaService],
  controllers: [OktaController],
  exports: [OktaService],
})
export class OktaModule {}
