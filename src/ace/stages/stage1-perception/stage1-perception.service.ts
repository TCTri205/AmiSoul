import { Injectable, Logger } from '@nestjs/common';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';

@Injectable()
export class Stage1PerceptionService {
  private readonly logger = new Logger(Stage1PerceptionService.name);

  async process(payload: AggregatedMessageBlockDto, signal?: AbortSignal) {
    this.logger.log(`Stage 1: Processing perception for user ${payload.userId}`);
    
    // Simulate some async work that respects the AbortSignal
    await this.simulateWork(2000, signal);
    
    this.logger.log(`Stage 1: Completed for user ${payload.userId}`);
    return {
      intent: 'general_chat',
      sentiment: 'neutral',
      urgency: 1,
    };
  }

  private async simulateWork(ms: number, signal?: AbortSignal) {
    return new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        signal?.removeEventListener('abort', onAbort);
        resolve();
      }, ms);
      
      const onAbort = () => {
        clearTimeout(timeout);
        reject(new Error('AbortError'));
      };
      
      if (signal) {
        if (signal.aborted) {
          clearTimeout(timeout);
          return reject(new Error('AbortError'));
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }
    });
  }
}
