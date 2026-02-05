import { Module } from '@nestjs/common';
import { FrameworksController } from './frameworks.controller';
import { FrameworksService } from './frameworks.service';
import { PrismaModule } from '../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FrameworksController],
  providers: [FrameworksService],
  exports: [FrameworksService],
})
export class FrameworksModule {}
