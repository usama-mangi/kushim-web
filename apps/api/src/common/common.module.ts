import { Global, Module } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { TfIdfService } from './tfidf.service';
import { EmbeddingService } from './embedding.service';
import { TracingService } from './tracing.service';

@Global()
@Module({
  providers: [EncryptionService, TfIdfService, EmbeddingService, TracingService],
  exports: [EncryptionService, TfIdfService, EmbeddingService, TracingService],
})
export class CommonModule {}
