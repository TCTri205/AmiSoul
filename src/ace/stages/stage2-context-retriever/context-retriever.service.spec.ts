import { Test, TestingModule } from '@nestjs/testing';
import { ContextRetrieverService } from './context-retriever.service';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { LlmOrchestrator } from '../../../ai-provider/llm-orchestrator.service';
import { CognitiveContext } from '../../middleware/dto/cognitive-context.dto';

describe('ContextRetrieverService', () => {
  let service: ContextRetrieverService;
  let prisma: jest.Mocked<PrismaService>;
  let redis: jest.Mocked<RedisService>;
  let orchestrator: jest.Mocked<LlmOrchestrator>;

  beforeEach(async () => {
    const prismaMock = {
      searchSimilarMemories: jest.fn(),
      user: {
        findUnique: jest.fn(),
      },
    };

    const redisMock = {
      get: jest.fn(),
    };

    const orchestratorMock = {
      embed: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContextRetrieverService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: RedisService, useValue: redisMock },
        { provide: LlmOrchestrator, useValue: orchestratorMock },
      ],
    }).compile();

    service = module.get<ContextRetrieverService>(ContextRetrieverService);
    prisma = module.get(PrismaService);
    redis = module.get(RedisService);
    orchestrator = module.get(LlmOrchestrator);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('retrieve', () => {
    const context = new CognitiveContext({
      userId: 'user-1',
      sessionId: 'session-1',
      rawInput: 'Hello there',
      perception: {
        intent: 'greeting',
        sentiment: 'positive',
        complexity: 1,
        urgency: 1,
        identity_anomaly: false,
        routing_confidence: 1,
        sarcasm_hint: false,
        timestamp_flag: false,
        noise_flag: false,
        is_crisis: false,
        is_injection: false,
      },
    });

    it('should successfully retrieve and rank memories', async () => {
      orchestrator.embed.mockResolvedValue([0.1, 0.2]);
      
      const mockMemories = [
        {
          id: 'mem-1',
          content: 'Old memory',
          similarity: 0.8,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          metadata: { sentiment: 'positive', type: 'episodic' },
        },
        {
          id: 'mem-2',
          content: 'Fact memory',
          similarity: 0.9,
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
          metadata: { sentiment: 'neutral', type: 'semantic' },
        }
      ];
      
      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      prisma.user.findUnique.mockResolvedValue({ bondingScore: 50 } as any);
      redis.get.mockImplementation(async (key) => {
        if (key === 'vibe:user-1') return 'positive';
        if (key === 'cal:expectations:user-1') return JSON.stringify([{ event: 'Meeting' }]);
        return null;
      });

      const result = await service.retrieve(context);

      expect(result.memories).toHaveLength(2);
      expect(result.memories[0].id).toBe('mem-1'); // Should be first due to sentiment alignment and recency
      expect(result.calEvents).toHaveLength(1);
      expect(result.calEvents[0].event).toBe('Meeting');
      expect(result.bondingScore).toBe(50);
      expect(result.sessionVibe).toBe('positive');
    });

    it('should filter memories for strangers (bonding <= 20)', async () => {
      orchestrator.embed.mockResolvedValue([0.1, 0.2]);
      
      const mockMemories = [
        {
          id: 'mem-1',
          content: 'Episodic story',
          similarity: 0.9,
          createdAt: new Date(),
          metadata: { sentiment: 'positive', type: 'episodic' },
        },
        {
          id: 'mem-2',
          content: 'Semantic fact',
          similarity: 0.8,
          createdAt: new Date(),
          metadata: { sentiment: 'neutral', type: 'semantic' },
        }
      ];
      
      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      prisma.user.findUnique.mockResolvedValue({ bondingScore: 10 } as any);
      redis.get.mockResolvedValue(null);

      const result = await service.retrieve(context);

      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].id).toBe('mem-2'); // Only semantic
    });

    it('should handle failures gracefully and return minimal context', async () => {
      orchestrator.embed.mockRejectedValue(new Error('Embedding failed'));

      const result = await service.retrieve(context);

      expect(result.memories).toHaveLength(0);
      expect(result.calEvents).toHaveLength(0);
      expect(result.bondingScore).toBe(0);
    });
  });
});
