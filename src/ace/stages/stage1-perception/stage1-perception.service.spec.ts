import { Test, TestingModule } from '@nestjs/testing';
import { Stage1PerceptionService } from './stage1-perception.service';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';
import { SessionType } from '../../../chat/dto/message.dto';
import { CrisisService } from './crisis.service';
import { InjectionDetectionService } from './injection-detection.service';
import { TimeAnomalyService } from './time-anomaly.service';
import { LlmOrchestrator } from '../../../ai-provider/llm-orchestrator.service';

describe('Stage1PerceptionService', () => {
  let service: Stage1PerceptionService;
  let orchestrator: jest.Mocked<LlmOrchestrator>;

  beforeEach(async () => {
    const orchestratorMock = {
      generate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Stage1PerceptionService,
        { provide: LlmOrchestrator, useValue: orchestratorMock },
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
        {
          provide: TimeAnomalyService,
          useValue: {
            checkAnomaly: jest.fn().mockResolvedValue(false),
          },
        },
      ],
    }).compile();

    service = module.get<Stage1PerceptionService>(Stage1PerceptionService);
    orchestrator = module.get(LlmOrchestrator);
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

      orchestrator.generate.mockResolvedValue({
        text: JSON.stringify(mockResult),
        provider: 'groq',
        model: 'llama3',
      });

      const result = await service.process(payload);

      expect(result.perception).toEqual({ ...mockResult, is_crisis: false, is_injection: false });
      expect(orchestrator.generate).toHaveBeenCalled();
    });

    it('should return fallback results on Orchestrator failure', async () => {
      orchestrator.generate.mockRejectedValue(new Error('LLM Failure'));

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

      orchestrator.generate.mockResolvedValue({
        text: JSON.stringify(mockResult),
        provider: 'groq',
        model: 'llama3',
      });

      const result = await service.process(crisisPayload);

      expect(result.perception.is_crisis).toBe(true);
      expect(result.perception.urgency).toBe(10);
    });

    it('should respect AbortSignal', async () => {
      const controller = new AbortController();
      controller.abort();

      orchestrator.generate.mockImplementation(async (req) => {
        if (req.signal?.aborted) throw new Error('AbortError');
        return { text: 'ok', provider: 'p', model: 'm' };
      });

      await expect(service.process(payload, controller.signal))
        .rejects.toThrow('AbortError');
    });

    it('should boost complexity and set timestamp_flag when Time Anomaly is detected', async () => {
      const mockTimeAnomalyService = (service as any).timeAnomalyService;
      mockTimeAnomalyService.checkAnomaly.mockResolvedValue('Late_Night');

      const mockResult = {
        intent: 'greeting',
        sentiment: 'neutral',
        complexity: 5,
        urgency: 5,
        identity_anomaly: false,
        routing_confidence: 0.9,
        sarcasm_hint: false,
        timestamp_flag: false,
        noise_flag: false,
      };

      orchestrator.generate.mockResolvedValue({
        text: JSON.stringify(mockResult),
        provider: 'groq',
        model: 'llama3',
      });

      const result = await service.process(payload);

      expect(result.perception.timestamp_flag).toBe('Late_Night');
      expect(result.perception.complexity).toBe(7); // 5 + 2
    });
  });
});
