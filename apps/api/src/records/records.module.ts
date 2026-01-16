import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { RelationshipService } from './relationship.service';
import { MLScoringService } from './ml-scoring.service';

@Module({
  providers: [RecordsService, RelationshipService, MLScoringService],
  controllers: [RecordsController],
  exports: [RecordsService, RelationshipService, MLScoringService],
})
export class RecordsModule {}
