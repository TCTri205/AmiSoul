import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AggregatedMessageBlockDto } from './stages/stage0-aggregator/dto/aggregated-message-block.dto';
import { Stage1PerceptionService } from './stages/stage1-perception/stage1-perception.service';

@Injectable()
export class AcePipelineService {
  private readonly logger = new Logger(AcePipelineService.name);

  constructor(
    private readonly stage1: Stage1PerceptionService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('stage0.aggregated')
  async handleAggregatedBlock(payload: AggregatedMessageBlockDto) {
    const { userId, signal } = payload;
    let status: 'success' | 'aborted' | 'failed' = 'success';
    
    try {
      this.logger.log(`Starting ACE Pipeline for user: ${userId}`);
      
      // Stage 1: Perception
      const perception = await this.stage1.process(payload, signal);
      
      // Stage 2: Retrieval (Stub)
      if (signal?.aborted) throw new Error('AbortError');
      this.logger.debug(`Stage 2 (Stub) for user: ${userId}`);
      
      // Stage 3: Simulation (Stub)
      if (signal?.aborted) throw new Error('AbortError');
      this.logger.debug(`Stage 3 (Stub) for user: ${userId}`);
      
      // Stage 4: Vibe Monitor (Stub)
      if (signal?.aborted) throw new Error('AbortError');
      this.logger.debug(`Stage 4 (Stub) for user: ${userId}`);

      this.logger.log(`ACE Pipeline completed successfully for user: ${userId}`);
      
    } catch (error) {
      if (error.message === 'AbortError' || error.name === 'AbortError' || signal?.aborted) {
        this.logger.warn(`ACE Pipeline aborted for user: ${userId}`);
        status = 'aborted';
      } else {
        this.logger.error(`ACE Pipeline failed for user: ${userId}`, error.stack);
        status = 'failed';
      }
    } finally {
      // Always notify Stage 0 that the pipeline is done (even if aborted)
      // to reset preemption counters
      this.eventEmitter.emit('pipeline.completed', { userId, status });
    }
  }
}
