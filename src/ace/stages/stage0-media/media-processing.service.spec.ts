import { Test, TestingModule } from '@nestjs/testing';
import { MediaProcessingService } from './media-processing.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import { GeminiProvider } from '../../../ai-provider/providers/gemini.provider';

describe('MediaProcessingService', () => {
  let service: MediaProcessingService;
  let eventEmitter: EventEmitter2;
  let geminiProvider: GeminiProvider;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaProcessingService,
        {
          provide: EventEmitter2,
          useValue: {
            emit: jest.fn(),
          },
        },
        {
          provide: GeminiProvider,
          useValue: {
            generate: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key, defaultValue) => defaultValue),
          },
        },
      ],
    }).compile();

    service = module.get<MediaProcessingService>(MediaProcessingService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
    geminiProvider = module.get<GeminiProvider>(GeminiProvider);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processAudio', () => {
    it('should emit media.processed on success', async () => {
      const mockRequest = { 
        userId: 'user1', 
        clientId: 'client1',
        data: 'base64audio', 
        mimeType: 'audio/mp3' 
      };
      (geminiProvider.generate as jest.Mock).mockResolvedValue({ text: 'Hello world' });

      await service.processAudio(mockRequest);

      expect(eventEmitter.emit).toHaveBeenCalledWith('media.processed', expect.objectContaining({
        userId: 'user1',
        clientId: 'client1',
        processedText: 'Hello world',
        mediaType: 'audio',
        metadata: expect.objectContaining({ origin: 'voice' })
      }));
    });

    it('should emit media.error on failure', async () => {
      const mockRequest = { 
        userId: 'user1', 
        clientId: 'client1',
        data: 'base64audio', 
        mimeType: 'audio/mp3' 
      };
      (geminiProvider.generate as jest.Mock).mockRejectedValue(new Error('API Error'));

      await service.processAudio(mockRequest);

      expect(eventEmitter.emit).toHaveBeenCalledWith('media.error', expect.objectContaining({
        userId: 'user1',
        error: 'API Error',
        code: 'AUDIO_PROCESSING_FAILED'
      }));
    });
  });

  describe('processImage', () => {
    it('should emit media.processed on success with image tags', async () => {
      const mockRequest = { 
        userId: 'user1', 
        clientId: 'client1',
        data: 'base64image', 
        mimeType: 'image/jpeg' 
      };
      (geminiProvider.generate as jest.Mock).mockResolvedValue({ text: 'A cat' });

      await service.processImage(mockRequest);

      expect(eventEmitter.emit).toHaveBeenCalledWith('media.processed', expect.objectContaining({
        userId: 'user1',
        clientId: 'client1',
        processedText: '<image_context>A cat</image_context>',
        mediaType: 'image',
        metadata: expect.objectContaining({ origin: 'image' })
      }));
    });
  });
});