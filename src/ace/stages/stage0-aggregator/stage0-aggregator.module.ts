import { Module } from '@nestjs/common';
import { Stage0AggregatorService } from './stage0-aggregator.service';
import { RedisModule } from '../../../redis/redis.module';

@Module({
  imports: [RedisModule],
  providers: [Stage0AggregatorService],
  exports: [Stage0AggregatorService],
})
export class Stage0AggregatorModule {}
