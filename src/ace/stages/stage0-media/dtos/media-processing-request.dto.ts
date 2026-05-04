export class MediaProcessingRequestDto {
  userId: string;
  clientId: string;
  sessionType?: string;
  data: string;
  mimeType: string;
}