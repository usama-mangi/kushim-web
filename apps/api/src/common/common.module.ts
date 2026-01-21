import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { TfIdfService } from './tfidf.service';
import { EmbeddingService } from './embedding.service';

@Global()
@Module({
  providers: [EncryptionService, TfIdfService, EmbeddingService],
  exports: [EncryptionService, TfIdfService, EmbeddingService],
})
export class CommonModule {}
