import { PerceptionResultDto } from '../../stages/stage1-perception/dto/perception-result.dto';

export class CognitiveContext {
  userId: string;

  sessionId: string;

  rawInput: string;

  perception: PerceptionResultDto;

  normalizedSentiment: number; // -1.0 to 1.0

  routingPath: 'fast' | 'full';

  summary?: string;

  timestamp: Date;

  constructor(partial: Partial<CognitiveContext>) {
    Object.assign(this, partial);
    this.timestamp = partial.timestamp ?? new Date();
  }
}
