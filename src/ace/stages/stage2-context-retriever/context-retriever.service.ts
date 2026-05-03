import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { LlmOrchestrator } from '../../../ai-provider/llm-orchestrator.service';
import { CognitiveContext } from '../../middleware/dto/cognitive-context.dto';
import { RetrievedContextDto, StoredMemory, CalEvent } from './dto/retrieved-context.dto';

@Injectable()
export class ContextRetrieverService {
  private readonly logger = new Logger(ContextRetrieverService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly llmOrchestrator: LlmOrchestrator,
  ) {}

  async retrieve(context: CognitiveContext, signal?: AbortSignal): Promise<RetrievedContextDto> {
    const { userId, rawInput, perception } = context;
    
    this.logger.log(`Stage 2: Retrieving context for user ${userId}`);

    try {
      // 1. Generate embedding for current input
      const queryVector = await this.llmOrchestrator.embed(rawInput);

      // 2. Parallel fetching from various sources
      const [similarMemories, calEvents, user, currentVibe] = await Promise.all([
        this.prisma.searchSimilarMemories(userId, queryVector, 10), // Fetch 10 candidates
        this.getCalL1Events(userId),
        this.prisma.user.findUnique({ where: { id: userId }, select: { bondingScore: true } }),
        this.redis.get(`vibe:${userId}`),
      ]);

      const bondingScore = user?.bondingScore ?? 0;
      const vibe = currentVibe ?? 'neutral';

      // 3. Rank memories using Affective Retrieval formula
      const rankedMemories = this.rankMemories(similarMemories, vibe);

      // 4. Apply Bonding Filter
      const filteredMemories = this.filterByBonding(rankedMemories, bondingScore);

      // 5. Build final context
      const result: RetrievedContextDto = {
        memories: filteredMemories.slice(0, 5), // Limit to top 5 after ranking/filtering
        calEvents,
        bondingScore,
        sessionVibe: vibe,
        tokenEstimates: {
          memories: this.estimateTokens(filteredMemories.slice(0, 5).map(m => m.content).join(' ')),
          cal: this.estimateTokens(JSON.stringify(calEvents)),
          history: 0, // Will be calculated in Stage 3
        },
      };

      this.logger.log(`Stage 2: Retrieved ${result.memories.length} memories and ${result.calEvents.length} CAL events`);
      return result;

    } catch (error) {
      if (error.name === 'AbortError' || signal?.aborted) {
        throw error;
      }
      this.logger.error(`Stage 2 failed for user ${userId}: ${error.message}`);
      
      // Fallback to minimal context
      return {
        memories: [],
        calEvents: [],
        bondingScore: 0,
        sessionVibe: 'neutral',
        tokenEstimates: { memories: 0, cal: 0, history: 0 },
      };
    }
  }

  private async getCalL1Events(userId: string): Promise<CalEvent[]> {
    const events: CalEvent[] = [];
    
    try {
      // Fetch Active Expectations
      const expectationsRaw = await this.redis.get(`cal:expectations:${userId}`);
      if (expectationsRaw) {
        const parsed = JSON.parse(expectationsRaw);
        if (Array.isArray(parsed)) {
          events.push(...parsed.map(e => ({ ...e, type: 'expectation' as const })));
        }
      }

      // Fetch Pending States
      const pendingRaw = await this.redis.get(`cal:pending:${userId}`);
      if (pendingRaw) {
        const parsed = JSON.parse(pendingRaw);
        if (Array.isArray(parsed)) {
          events.push(...parsed.map(e => ({ ...e, type: 'pending' as const })));
        }
      }

      // Fetch Important Dates
      const datesRaw = await this.redis.get(`cal:dates:${userId}`);
      if (datesRaw) {
        const parsed = JSON.parse(datesRaw);
        if (Array.isArray(parsed)) {
          events.push(...parsed.map(e => ({ ...e, type: 'date' as const })));
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to fetch CAL L1 events: ${error.message}`);
    }

    return events;
  }

  private rankMemories(memories: any[], currentVibe: string): StoredMemory[] {
    const now = new Date();

    return memories.map(memory => {
      const vectorSim = memory.similarity || 0;
      
      // Affective Alignment (0.0 to 1.0)
      const memorySentiment = memory.metadata?.sentiment || 'neutral';
      const affectiveAlign = this.calculateAffectiveAlignment(memorySentiment, currentVibe);

      // Recency Weight (0.0 to 1.0)
      const createdAt = new Date(memory.createdAt);
      const daysOld = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const recency = Math.max(0, 1 - daysOld / 365); // Decay over 1 year

      // Formula: Score = (0.5 * Vector_Sim) + (0.3 * Affective_Align) + (0.2 * Recency)
      const retrievalScore = (0.5 * vectorSim) + (0.3 * affectiveAlign) + (0.2 * recency);

      return {
        ...memory,
        retrievalScore,
      } as StoredMemory;
    }).sort((a, b) => b.retrievalScore - a.retrievalScore);
  }

  private calculateAffectiveAlignment(memorySentiment: string, currentVibe: string): number {
    if (memorySentiment === currentVibe) return 1.0;
    
    // Neutral is somewhat aligned with everything
    if (memorySentiment === 'neutral' || currentVibe === 'neutral') return 0.5;
    
    // Opposite sentiments
    return 0.0;
  }

  private filterByBonding(memories: StoredMemory[], bondingScore: number): StoredMemory[] {
    // Bonding Filter (T3.2 Rule):
    // Stranger (0-20): Only Semantic Nodes (metadata.type === 'semantic')
    // Friend+ (21-100): Episodic Nodes (all)
    
    if (bondingScore <= 20) {
      return memories.filter(m => m.metadata?.type === 'semantic');
    }
    
    return memories;
  }

  private estimateTokens(text: string): number {
    // Basic estimation: 1 token approx 4 characters
    return Math.ceil(text.length / 4);
  }
}
