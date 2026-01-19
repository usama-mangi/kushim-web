import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { RelationshipService } from './relationship.service';
import { MLScoringService } from './ml-scoring.service';
import { GraphService } from './graph.service';

@Module({
  providers: [RecordsService, RelationshipService, MLScoringService, GraphService],
  controllers: [RecordsController],
  exports: [RecordsService, RelationshipService, MLScoringService, GraphService],
})
export class RecordsModule {}
