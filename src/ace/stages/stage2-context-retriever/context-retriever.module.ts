import { Module } from '@nestjs/common';
import { ContextRetrieverService } from './context-retriever.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { RedisModule } from '../../../redis/redis.module';
import { AiProviderModule } from '../../../ai-provider/ai-provider.module';

@Module({
  imports: [
    PrismaModule,
    RedisModule,
    AiProviderModule,
  ],
  providers: [ContextRetrieverService],
  exports: [ContextRetrieverService],
})
export class ContextRetrieverModule {}
