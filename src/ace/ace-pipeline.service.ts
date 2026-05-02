import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AggregatedMessageBlockDto } from './stages/stage0-aggregator/dto/aggregated-message-block.dto';
import { Stage1PerceptionService } from './stages/stage1-perception/stage1-perception.service';
import { PerceptionResultDto } from './stages/stage1-perception/dto/perception-result.dto';

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
      
      // Stage 1: Perception (Always runs as the Router)
      const perception = await this.stage1.process(payload, signal);
      
      // Routing Decision Logic (T2.2)
      const isComplex = perception.complexity > 7 || perception.routing_confidence < 0.85 || perception.urgency > 8;
      
      if (isComplex) {
        await this.runFullCognitivePath(payload, perception, signal);
      } else {
        await this.runFastPath(payload, perception, signal);
      }

      this.logger.log(`ACE Pipeline completed successfully for user: ${userId} (${isComplex ? 'Full' : 'Fast'} Path)`);
      
    } catch (error) {
      if (error.message === 'AbortError' || error.name === 'AbortError' || signal?.aborted) {
        this.logger.warn(`ACE Pipeline aborted for user: ${userId}`);
        status = 'aborted';
      } else {
        this.logger.error(`ACE Pipeline failed for user: ${userId}`, error.stack);
        status = 'failed';
      }
    } finally {
      this.eventEmitter.emit('pipeline.completed', { userId, status });
    }
  }

  /**
   * Full Cognitive Path: Stage 1 -> Stage 2 (Retrieval) -> Stage 3 (LLM) -> Stage 4 (Monitor)
   */
  private async runFullCognitivePath(payload: AggregatedMessageBlockDto, perception: PerceptionResultDto, signal?: AbortSignal) {
    const { userId } = payload;
    this.logger.log(`Routing user ${userId} to FULL COGNITIVE PATH (Confidence: ${perception.routing_confidence})`);

    // Stage 2: Context Retrieval (CMA + CAL)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 2: Retrieving deep context for user: ${userId}`);
    // [TODO] Call Stage 2 Service

    // Stage 3: LLM Simulation (Full Reasoning)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 3: Simulating empathetic response for user: ${userId}`);
    // [TODO] Call Stage 3 Service

    // Stage 4: Vibe & Safety Monitor
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 4: Monitoring session vibe for user: ${userId}`);
    // [TODO] Call Stage 4 Service
  }

  /**
   * Fast Path: Stage 1 -> Stage 3 (Fast Response) -> Stage 4 (Sync)
   * Skips deep retrieval to reduce latency for simple interactions.
   */
  private async runFastPath(payload: AggregatedMessageBlockDto, perception: PerceptionResultDto, signal?: AbortSignal) {
    const { userId } = payload;
    this.logger.log(`Routing user ${userId} to FAST PATH (Confidence: ${perception.routing_confidence})`);

    // Stage 2: Skip or minimal retrieval
    this.logger.debug(`Stage 2: Skipping deep retrieval for fast path (User: ${userId})`);

    // Stage 3: Fast Simulation (Small model or direct response)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 3: Generating fast response for user: ${userId}`);

    // Stage 4: Monitor (Still needed for safety)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 4: Monitoring fast session for user: ${userId}`);
  }
}
