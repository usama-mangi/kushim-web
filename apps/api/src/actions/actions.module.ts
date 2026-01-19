import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { RecordsModule } from '../records/records.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [RecordsModule, CommonModule],
  providers: [ActionsService],
  controllers: [ActionsController],
  exports: [ActionsService],
})
export class ActionsModule {}
