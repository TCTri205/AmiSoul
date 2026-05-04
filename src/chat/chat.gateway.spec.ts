import { Test, TestingModule } from '@nestjs/testing';
import { ChatGateway } from './chat.gateway';
import { AuthService } from '../auth/auth.service';
import { Stage0AggregatorService } from '../ace/stages/stage0-aggregator/stage0-aggregator.service';
import { MediaProcessingService } from '../ace/stages/stage0-media/media-processing.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionType } from './dto/message.dto';

describe('ChatGateway', () => {
  let gateway: ChatGateway;
  let mediaService: MediaProcessingService;

  const mockAuthService = {};
  const mockAggregatorService = {
    aggregateMessage: jest.fn().mockResolvedValue(undefined),
  };
  const mockMediaService = {
    processAudio: jest.fn(),
    processImage: jest.fn(),
  };
  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatGateway,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Stage0AggregatorService, useValue: mockAggregatorService },
        { provide: MediaProcessingService, useValue: mockMediaService },
        { provide: EventEmitter2, useValue: new EventEmitter2() },
      ],
    }).compile();

    gateway = module.get<ChatGateway>(ChatGateway);
    mediaService = module.get<MediaProcessingService>(MediaProcessingService);
    (gateway as any).server = mockServer;
  });

  it('should call mediaService.processAudio when user_audio is received', async () => {
    const mockClient = { id: 'client1', user: { id: 'user1' }, sessionType: SessionType.PERSISTENT } as any;
    const mockData = { audio: 'data:audio/webm;base64,abc', mimeType: 'audio/webm' };

    await gateway.handleAudio(mockClient, mockData);

    expect(mediaService.processAudio).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user1',
      data: 'abc',
    }));
  });

  it('should call mediaService.processImage when user_image is received', async () => {
    const mockClient = { id: 'client1', user: { id: 'user1' }, sessionType: SessionType.PERSISTENT } as any;
    const mockData = { image: 'data:image/jpeg;base64,xyz', mimeType: 'image/jpeg' };

    await gateway.handleImage(mockClient, mockData);

    expect(mediaService.processImage).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user1',
      data: 'xyz',
    }));
  });

  it('should emit crisis_response when pipeline.safety_override is triggered', () => {
    const payload = {
      userId: 'user-123',
      content: 'Safety response',
      perception: { mood: 'crisis' },
    };

    gateway.handleSafetyOverride(payload);

    expect(mockServer.to).toHaveBeenCalledWith('user:user-123');
    expect(mockServer.emit).toHaveBeenCalledWith('crisis_response', expect.objectContaining({
      content: 'Safety response',
      metadata: expect.objectContaining({
        is_crisis: true,
      }),
    }));
  });
});
