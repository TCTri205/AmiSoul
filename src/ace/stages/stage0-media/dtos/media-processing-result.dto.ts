export class MediaProcessingResultDto {
  userId: string;
  clientId: string;
  sessionType?: string;
  processedText: string;
  mediaType: 'audio' | 'image';
  metadata: {
    origin: string;
    provider: string;
    processingTimeMs: number;
  };
}