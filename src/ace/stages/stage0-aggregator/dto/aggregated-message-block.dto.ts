import { SessionType } from '../../../../chat/dto/message.dto';

export class AggregatedMessageBlockDto {
  userId: string;
  messages: {
    content: string;
    timestamp: string;
  }[];
  sessionType: SessionType;
  fullContent: string;
  requiresSummarization: boolean;
  aggregatedAt: string;
  signal?: AbortSignal;
}
