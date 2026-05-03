import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Stage1PerceptionService } from './stage1-perception.service';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';
import { SessionType } from '../../../chat/dto/message.dto';
import { CrisisService } from './crisis.service';
import { InjectionDetectionService } from './injection-detection.service';

// Mocking GoogleGenerativeAI
const mockModel = {
  generateContent: jest.fn(),
};

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue(mockModel),
  })),
}));

describe('Stage1PerceptionService', () => {
  let service: Stage1PerceptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Stage1PerceptionService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'GEMINI_API_KEY') return 'test-api-key';
              return null;
            }),
          },
        },
        {
          provide: CrisisService,
          useValue: {
            isCrisis: jest.fn().mockReturnValue(false),
            getSafetyResponse: jest.fn().mockReturnValue('Safety Response'),
          },
        },
        {
          provide: InjectionDetectionService,
          useValue: {
            detect: jest.fn().mockReturnValue({ detected: false, confidence: 0 }),
          },
        },
      ],
    }).compile();

    service = module.get<Stage1PerceptionService>(Stage1PerceptionService);
    
    // Initialize the service manually
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockModel.generateContent.mockReset();
    // Close the breaker after each test to avoid state leakage
    if ((service as any).breaker) {
      (service as any).breaker.close();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('process', () => {
    const payload: AggregatedMessageBlockDto = {
      userId: 'user1',
      sessionId: 'session1',
      messages: [{ content: 'hello', timestamp: '' }],
      sessionType: SessionType.PERSISTENT,
      fullContent: 'hello',
      requiresSummarization: false,
      aggregatedAt: '',
    };

    it('should return perception results on success', async () => {
      const mockResult = {
        intent: 'greeting',
        sentiment: 'positive',
        complexity: 2,
        urgency: 1,
        identity_anomaly: false,
        routing_confidence: 0.95,
        sarcasm_hint: false,
        timestamp_flag: false,
        noise_flag: false,
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResult),
        },
      });

      const result = await service.process(payload);

      expect(result.perception).toEqual({ ...mockResult, is_crisis: false, is_injection: false });
      expect(mockModel.generateContent).toHaveBeenCalled();
    });

    it('should return fallback results on Gemini API failure', async () => {
      mockModel.generateContent.mockRejectedValue(new Error('API Error'));

      const result = await service.process(payload);

      expect(result.perception).toEqual({
        intent: 'unknown',
        sentiment: 'neutral',
        complexity: 5,
        urgency: 5,
        identity_anomaly: false,
        routing_confidence: 0,
        sarcasm_hint: false,
        timestamp_flag: false,
        noise_flag: false,
        is_crisis: false,
        is_injection: false,
      });
    });

    it('should retry up to 3 times on transient failure', async () => {
      mockModel.generateContent
        .mockRejectedValueOnce(new Error('Transient Error'))
        .mockRejectedValueOnce(new Error('Transient Error'))
        .mockResolvedValue({
          response: {
            text: () => JSON.stringify({
              intent: 'greeting',
              sentiment: 'neutral',
              complexity: 1,
              urgency: 1,
              identity_anomaly: false,
              routing_confidence: 0.9,
              sarcasm_hint: false,
              timestamp_flag: false,
              noise_flag: false
            }),
          },
        });

      const result = await service.process(payload);

      expect(result.perception.intent).toBe('greeting');
      expect(mockModel.generateContent).toHaveBeenCalledTimes(3);
    });

    it('should respect AbortSignal', async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(service.process(payload, controller.signal))
        .rejects.toThrow('AbortError');
    });

    it('should open circuit breaker on multiple failures', async () => {
      // Force failure to trigger circuit breaker
      mockModel.generateContent.mockRejectedValue(new Error('Persistent Error'));

      // Fire multiple times to trigger circuit breaker (default threshold 50%)
      for (let i = 0; i < 15; i++) {
        await service.process(payload);
      }

      expect((service as any).breaker.opened).toBe(true);
      
      // Subsequent call should fail fast without calling generateContent
      mockModel.generateContent.mockClear();
      const result = await service.process(payload);
      
      expect(mockModel.generateContent).not.toHaveBeenCalled();
      // Should still return fallback even when circuit is open
      expect(result.perception.intent).toBe('unknown');
    });

    it('should flag crisis and set max urgency when CrisisService returns true', async () => {
      const crisisPayload = { ...payload, fullContent: 'Tôi muốn tự tử' };
      const mockCrisisService = (service as any).crisisService;
      mockCrisisService.isCrisis.mockReturnValue(true);

      const mockResult = {
        intent: 'venting',
        sentiment: 'negative',
        complexity: 1,
        urgency: 1,
        identity_anomaly: false,
        routing_confidence: 1.0,
        sarcasm_hint: false,
        timestamp_flag: false,
        noise_flag: false,
      };

      mockModel.generateContent.mockResolvedValue({
        response: {
          text: () => JSON.stringify(mockResult),
        },
      });

      const result = await service.process(crisisPayload);

      expect(result.perception.is_crisis).toBe(true);
      expect(result.perception.urgency).toBe(10);
    });
  });
});
