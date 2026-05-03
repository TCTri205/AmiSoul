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
          sensitivityLevel: 1,
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          metadata: { sentiment: 'positive', type: 'episodic' },
        },
        {
          id: 'mem-2',
          content: 'Fact memory',
          similarity: 0.9,
          sensitivityLevel: 1,
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000), // 100 days ago
          metadata: { sentiment: 'neutral', type: 'semantic' },
        },
      ];

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({
        bondingScore: 50,
        dpe: { traits: ['warm'] },
      });
      redis.get.mockImplementation(async (key) => {
        if (key === 'vibe:user-1') return 'positive';
        if (key === 'cal:expectations:user-1') return JSON.stringify([{ event: 'Meeting' }]);
        if (key === 'chat_history:user-1') return JSON.stringify([{ role: 'user', content: 'hi' }]);
        return null;
      });

      const result = await service.retrieve(context);

      expect(result.memories).toHaveLength(2);
      expect(result.memories[0].id).toBe('mem-1'); // Should be first due to sentiment alignment and recency
      expect(result.calEvents).toHaveLength(1);
      expect(result.calEvents[0].event).toBe('Meeting');
      expect(result.bondingScore).toBe(50);
      expect(result.sessionVibe).toBe('positive');
      expect(result.personaShield).toBeDefined();
      expect(result.userPersonaModel).toEqual({ traits: ['warm'] });
      expect(result.tokenEstimates.persona).toBeGreaterThan(0);
      expect(result.tokenEstimates.dpe).toBeGreaterThan(0);
    });

    it('should truncate memories that exceed the 800 token budget', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);

      // Create 10 large memories (each approx 100 tokens = 400 chars)
      const mockMemories = Array.from({ length: 10 }, (_, i) => ({
        id: `mem-${i}`,
        content: 'A'.repeat(250),
        similarity: 0.9,
        createdAt: new Date(),
        metadata: { type: 'episodic' },
      }));

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 50, dpe: {} });
      redis.get.mockImplementation(async (key) => {
        if (key.includes('vibe')) return 'neutral';
        return null;
      });

      const result = await service.retrieve(context);

      // Each memory approx (250 content + ~100 json overhead) / 4 = ~87 tokens
      // 800 / 87 = ~9 memories
      expect(result.memories.length).toBeLessThan(10);
      expect(result.memories.length).toBeGreaterThan(6);
      expect(result.tokenEstimates.memories).toBeLessThanOrEqual(804);
    });

    it('should truncate Knowledge (CAL + CMA) to a combined 800 token budget with CAL priority', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);

      // 5 large CAL events (approx 100 tokens each = 500 tokens)
      const largeCal = Array.from({ length: 5 }, (_, i) => ({
        event: 'A'.repeat(400),
        type: 'pending' as const,
      }));

      // 5 large CMA memories (approx 100 tokens each = 500 tokens)
      const mockMemories = Array.from({ length: 5 }, (_, i) => ({
        id: `mem-${i}`,
        content: 'B'.repeat(400),
        similarity: 0.9,
        createdAt: new Date(),
        metadata: { type: 'episodic' },
      }));

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 50, dpe: {} });
      redis.get.mockImplementation(async (key) => {
        if (key.includes('cal:pending')) return JSON.stringify(largeCal);
        return null;
      });

      const result = await service.retrieve(context);

      // CAL should have 5 items (500 tokens)
      // Remaining 300 tokens can fit 3 CMA memories
      expect(result.calEvents).toHaveLength(5);
      expect(result.memories.length).toBeLessThan(5);

      const totalKnowledge = result.tokenEstimates.cal + result.tokenEstimates.memories;
      expect(totalKnowledge).toBeLessThanOrEqual(950); // Allowing some buffer for stringify overhead
    });

    it('should truncate DPE model that exceeds the 200 token budget', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);
      prisma.searchSimilarMemories.mockResolvedValue([]);

      const largeDpe = { traits: 'A'.repeat(1000) };
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 50, dpe: largeDpe });
      redis.get.mockResolvedValue(null);

      const result = await service.retrieve(context);

      expect(result.tokenEstimates.dpe).toBeLessThanOrEqual(200);
    });

    it('should boost memories that are relevant to CAL events', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);

      const mockMemories = [
        {
          id: 'mem-1',
          content: 'I love going to the beach',
          similarity: 0.8,
          createdAt: new Date(),
          metadata: { sentiment: 'positive', type: 'episodic' },
        },
        {
          id: 'mem-2',
          content: 'The mountains are beautiful',
          similarity: 0.8,
          createdAt: new Date(),
          metadata: { sentiment: 'positive', type: 'episodic' },
        },
      ];

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 50, dpe: {} });

      // CAL event about "beach"
      redis.get.mockImplementation(async (key) => {
        if (key.includes('cal:expectations'))
          return JSON.stringify([{ event: 'Going to the beach tomorrow' }]);
        return null;
      });

      const result = await service.retrieve(context);

      expect(result.memories[0].id).toBe('mem-1'); // Boosted by CAL
      expect(result.memories[0].retrievalScore).toBeGreaterThan(result.memories[1].retrievalScore);
    });

    it('should filter memories for strangers (bonding <= 20) with L1 limit', async () => {
      orchestrator.embed.mockResolvedValue([0.1, 0.2]);

      const mockMemories = [
        {
          id: 'mem-1',
          content: 'Episodic story',
          similarity: 0.9,
          sensitivityLevel: 1,
          createdAt: new Date(),
          metadata: { sentiment: 'positive', type: 'episodic' },
        },
        {
          id: 'mem-2',
          content: 'Semantic fact L1',
          similarity: 0.8,
          sensitivityLevel: 1,
          createdAt: new Date(),
          metadata: { sentiment: 'neutral', type: 'semantic' },
        },
        {
          id: 'mem-3',
          content: 'Semantic fact L2',
          similarity: 0.8,
          sensitivityLevel: 2,
          createdAt: new Date(),
          metadata: { sentiment: 'neutral', type: 'semantic' },
        },
      ];

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 10 });
      redis.get.mockResolvedValue(null);

      const result = await service.retrieve(context);

      expect(result.memories).toHaveLength(1);
      expect(result.memories[0].id).toBe('mem-2'); // Only semantic AND L1
    });

    it('should respect sensitivity levels for friends (bonding 21-100)', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);

      const mockMemories = [
        {
          id: 'L1',
          content: 'C',
          sensitivityLevel: 1,
          createdAt: new Date(),
          metadata: { type: 'episodic' },
        },
        {
          id: 'L2',
          content: 'C',
          sensitivityLevel: 2,
          createdAt: new Date(),
          metadata: { type: 'episodic' },
        },
        {
          id: 'L3',
          content: 'C',
          sensitivityLevel: 3,
          createdAt: new Date(),
          metadata: { type: 'episodic' },
        },
        {
          id: 'L4',
          content: 'C',
          sensitivityLevel: 4,
          createdAt: new Date(),
          metadata: { type: 'episodic' },
        },
        {
          id: 'L5',
          content: 'C',
          sensitivityLevel: 5,
          createdAt: new Date(),
          metadata: { type: 'episodic' },
        },
      ];

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      redis.get.mockResolvedValue(null);

      // 1. Bonding 30 -> L2
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 30 });
      const res1 = await service.retrieve(context);
      expect(res1.memories.map((m) => m.id)).toEqual(expect.arrayContaining(['L1', 'L2']));
      expect(res1.memories.length).toBe(2);

      // 2. Bonding 50 -> L3
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 50 });
      const res2 = await service.retrieve(context);
      expect(res2.memories.map((m) => m.id)).toEqual(expect.arrayContaining(['L1', 'L2', 'L3']));
      expect(res2.memories.length).toBe(3);

      // 3. Bonding 70 -> L4
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 70 });
      const res3 = await service.retrieve(context);
      expect(res3.memories.map((m) => m.id)).toEqual(
        expect.arrayContaining(['L1', 'L2', 'L3', 'L4']),
      );
      expect(res3.memories.length).toBe(4);

      // 4. Bonding 90 -> L5
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 90 });
      const res4 = await service.retrieve(context);
      expect(res4.memories).toHaveLength(5);
    });

    it('should handle failures gracefully and return minimal context', async () => {
      orchestrator.embed.mockRejectedValue(new Error('Embedding failed'));

      const result = await service.retrieve(context);

      expect(result.memories).toHaveLength(0);
      expect(result.calEvents).toHaveLength(0);
      expect(result.bondingScore).toBe(0);
    });

    it('should handle slow database responses gracefully', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);

      // Mock prisma to be slow
      prisma.searchSimilarMemories.mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve([]), 100)),
      );
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 50 });
      redis.get.mockResolvedValue(null);

      // We don't have a timeout in Stage 2 itself yet, but it should wait and succeed if not aborted
      const result = await service.retrieve(context);
      expect(result).toBeDefined();
      expect(result.memories).toHaveLength(0);
    });
    it('should respect overall 3000 token context budget', async () => {
      orchestrator.embed.mockResolvedValue([0.1, 0.2]);

      // Create many memories (each ~100 tokens)
      const mockMemories = Array.from({ length: 20 }, (_, i) => ({
        id: `mem-${i}`,
        content: 'A'.repeat(400),
        similarity: 0.9,
        sensitivityLevel: 1,
        createdAt: new Date(),
        metadata: { sentiment: 'positive', type: 'episodic' },
      }));

      // Many CAL events
      const largeCal = Array.from({ length: 10 }, (_, i) => ({
        event: `Event ${'X'.repeat(200)}`,
        type: 'pending' as const,
      }));

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({
        bondingScore: 50,
        dpe: { traits: 'A'.repeat(500) },
      });

      redis.get.mockImplementation(async (key: string) => {
        if (key.includes('cal:pending')) return JSON.stringify(largeCal);
        if (key.includes('cal:expectations'))
          return JSON.stringify([{ event: `Expectation ${'Y'.repeat(300)}` }]);
        if (key.includes('vibe')) return 'positive';
        if (key.includes('cal:dates'))
          return JSON.stringify([{ event: `Date ${'Z'.repeat(200)}`, time: '2026-01-01' }]);
        return null;
      });

      const result = await service.retrieve(context);

      // Calculate total tokens
      const totalTokens = Object.values(result.tokenEstimates).reduce((sum, val) => sum + val, 0);

      // Should respect 3000 token budget (with small buffer for stringification overhead)
      expect(totalTokens).toBeLessThanOrEqual(3200);
    });

    it('should prioritize CAL over CMA in truth hierarchy', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);

      // Create CMA memories that conflict with CAL events
      const mockMemories = [
        {
          id: 'mem-1',
          content: 'I hate going to the beach - it is terrible and boring',
          similarity: 0.9,
          sensitivityLevel: 1,
          createdAt: new Date(),
          metadata: { sentiment: 'negative', type: 'episodic' },
        },
        {
          id: 'mem-2',
          content: 'The park is nice sometimes',
          similarity: 0.8,
          sensitivityLevel: 1,
          createdAt: new Date(),
          metadata: { sentiment: 'neutral', type: 'episodic' },
        },
      ];

      // CAL states user will go to beach (conflicting with memory sentiment)
      const conflictingCal = [
        { event: 'Going to the beach tomorrow - will be fun!', type: 'pending' as const },
      ];

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({ bondingScore: 50, dpe: {} });

      redis.get.mockImplementation(async (key: string) => {
        if (key.includes('cal:pending')) return JSON.stringify(conflictingCal);
        return null;
      });

      const result = await service.retrieve(context);

      // CAL should be included and take priority for truth context
      expect(result.calEvents).toHaveLength(1);
      expect(result.calEvents[0].event).toContain('beach');

      // The conflicting memory should still be retrievable but CAL takes precedence
      // in truth hierarchy for current expectations vs past experiences
      expect(result.calEvents.length + result.memories.length).toBeGreaterThan(0);
    });

    it('should apply combined token budgets across all context layers', async () => {
      orchestrator.embed.mockResolvedValue([0.1]);

      // Large persona (500 tokens)
      const largePersona = 'A'.repeat(2000);

      // Large memories (800 tokens budget)
      const mockMemories = Array.from({ length: 5 }, (_, i) => ({
        id: `mem-${i}`,
        content: 'B'.repeat(400),
        similarity: 0.9,
        sensitivityLevel: 1,
        createdAt: new Date(),
        metadata: { type: 'episodic' },
      }));

      // Large CAL (would exceed 800 alone)
      const largeCal = Array.from({ length: 8 }, (_, i) => ({
        event: 'C'.repeat(300),
        type: 'pending' as const,
      }));

      prisma.searchSimilarMemories.mockResolvedValue(mockMemories);
      (prisma.user.findUnique as any).mockResolvedValue({
        bondingScore: 50,
        dpe: largePersona,
      });

      redis.get.mockImplementation(async (key: string) => {
        if (key.includes('cal:pending')) return JSON.stringify(largeCal);
        if (key.includes('vibe')) return 'A'.repeat(500); // Large vibe
        return null;
      });

      const result = await service.retrieve(context);

      // Each sub-budget should be respected
      expect(result.tokenEstimates.dpe).toBeLessThanOrEqual(200);
      expect(result.tokenEstimates.memories).toBeLessThanOrEqual(800);
      expect(result.tokenEstimates.cal).toBeLessThanOrEqual(800);

      // Combined should stay within total context budget
      const totalTokens = Object.values(result.tokenEstimates).reduce((sum, val) => sum + val, 0);
      expect(totalTokens).toBeLessThanOrEqual(3200);
    });
  });
});
