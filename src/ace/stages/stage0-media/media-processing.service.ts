import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from '../../../ai-provider/providers/gemini.provider';
import { MediaProcessingRequestDto } from './dtos/media-processing-request.dto';
import { MediaProcessingResultDto } from './dtos/media-processing-result.dto';

@Injectable()
export class MediaProcessingService {
  private readonly logger = new Logger(MediaProcessingService.name);

  constructor(
    private readonly geminiProvider: GeminiProvider,
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}

  async processAudio(request: MediaProcessingRequestDto): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log(`Processing audio for user ${request.userId}`);
      
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 2000); // 2s limit per acceptance criteria

      const audioModel = this.configService.get<string>('GEMINI_MODEL_AUDIO', 'gemini-1.5-flash');

      const response = await this.geminiProvider.generate({
        model: audioModel,
        systemPrompt: 'You are a highly accurate speech-to-text service. Transcribe the user audio exactly as spoken. Output only the transcript, without any additional formatting or conversational text.',
        userPrompt: 'Please transcribe this audio.',
        mediaData: {
          data: request.data,
          mimeType: request.mimeType,
        },
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      
      const result: MediaProcessingResultDto = {
        userId: request.userId,
        clientId: request.clientId,
        sessionType: request.sessionType,
        processedText: response.text,
        mediaType: 'audio',
        metadata: {
          origin: 'voice',
          provider: 'gemini',
          processingTimeMs: processingTime,
        },
      };

      this.eventEmitter.emit('media.processed', result);
    } catch (error) {
      this.logger.error(`Error processing audio: ${error.message}`);
      this.eventEmitter.emit('media.error', {
        userId: request.userId,
        error: error.message,
        code: error.name === 'AbortError' ? 'TIMEOUT' : 'AUDIO_PROCESSING_FAILED',
      });
    }
  }

  async processImage(request: MediaProcessingRequestDto): Promise<void> {
    const startTime = Date.now();
    try {
      this.logger.log(`Processing image for user ${request.userId}`);
      
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 2000); // Tightened to 2s per acceptance criteria

      const imageModel = this.configService.get<string>('GEMINI_MODEL_IMAGE', 'gemini-1.5-flash');

      const response = await this.geminiProvider.generate({
        model: imageModel,
        systemPrompt: 'You are an advanced visual understanding AI. Describe the image provided in detail. Be observant, objective, and focus on the main elements, actions, and overall context.',
        userPrompt: 'Describe this image.',
        mediaData: {
          data: request.data,
          mimeType: request.mimeType,
        },
        signal: abortController.signal,
      });

      clearTimeout(timeoutId);
      const processingTime = Date.now() - startTime;
      
      const result: MediaProcessingResultDto = {
        userId: request.userId,
        clientId: request.clientId,
        sessionType: request.sessionType,
        processedText: `<image_context>${response.text}</image_context>`,
        mediaType: 'image',
        metadata: {
          origin: 'image',
          provider: 'gemini',
          processingTimeMs: processingTime,
        },
      };

      this.eventEmitter.emit('media.processed', result);
    } catch (error) {
      this.logger.error(`Error processing image: ${error.message}`);
      this.eventEmitter.emit('media.error', {
        userId: request.userId,
        error: error.message,
        code: error.name === 'AbortError' ? 'TIMEOUT' : 'IMAGE_PROCESSING_FAILED',
      });
    }
  }
}