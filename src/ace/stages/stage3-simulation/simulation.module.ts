import { Module } from '@nestjs/common';
import { SimulationService } from './simulation.service';
import { TokenBudgetManager } from './token-budget-manager.service';
import { AiProviderModule } from '../../../ai-provider/ai-provider.module';
import { RedisModule } from '../../../redis/redis.module';

@Module({
  imports: [AiProviderModule, RedisModule],
  providers: [SimulationService, TokenBudgetManager],
  exports: [SimulationService],
})
export class SimulationModule {}
