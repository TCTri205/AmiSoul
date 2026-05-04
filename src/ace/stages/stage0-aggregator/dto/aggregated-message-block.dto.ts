import { SessionType } from '../../../../chat/dto/message.dto';

export class AggregatedMessageBlockDto {
  userId: string;

  sessionId: string;

  messages: {
    content: string;
    timestamp: string;
    metadata?: any;
  }[];

  sessionType: SessionType;

  fullContent: string;

  requiresSummarization: boolean;

  aggregatedAt: string;

  signal?: AbortSignal;
}
