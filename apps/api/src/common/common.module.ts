import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { TfIdfService } from './tfidf.service';

@Global()
@Module({
  providers: [EncryptionService, TfIdfService],
  exports: [EncryptionService, TfIdfService],
})
export class CommonModule {}
