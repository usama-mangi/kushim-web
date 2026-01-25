import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { GraphController } from './graph.controller';
import { LinksController } from './links.controller';
import { RelationshipService } from './relationship.service';
import { MLScoringService } from './ml-scoring.service';
import { GraphService } from './graph.service';
import { RedisService } from '../common/redis.service';

@Module({
  providers: [
    RecordsService,
    RelationshipService,
    MLScoringService,
    GraphService,
    RedisService,
  ],
  controllers: [RecordsController, GraphController, LinksController],
  exports: [RecordsService, RelationshipService, MLScoringService, GraphService],
})
export class RecordsModule {}
