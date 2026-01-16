import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { ActionService } from './action.service';
import { ActionController } from './action.controller';

@Global()
@Module({
  providers: [EncryptionService, ActionService],
  controllers: [ActionController],
  exports: [EncryptionService, ActionService],
})
export class CommonModule {}
