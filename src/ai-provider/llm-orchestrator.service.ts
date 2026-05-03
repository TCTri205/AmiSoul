import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import CircuitBreaker from 'opossum';
import * as crypto from 'crypto';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { ILlmProvider, LlmRequest, LlmResponse } from './interfaces/llm-provider.interface';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class LlmOrchestrator implements OnModuleInit {
  private readonly logger = new Logger(LlmOrchestrator.name);

  private providers: { provider: ILlmProvider; breaker: CircuitBreaker }[] = [];

  constructor(
    private readonly groqProvider: GroqProvider,
    private readonly geminiProvider: GeminiProvider,
    private readonly redisService: RedisService,
  ) {}

  onModuleInit() {
    const breakerOptions = {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 50,
      resetTimeout: 30000,
      volumeThreshold: 5,
    };

    // Priority 1: Groq
    this.providers.push({
      provider: this.groqProvider,
      breaker: new CircuitBreaker(
        this.groqProvider.generate.bind(this.groqProvider),
        breakerOptions,
      ),
    });

    // Priority 2: Gemini
    this.providers.push({
      provider: this.geminiProvider,
      breaker: new CircuitBreaker(
        this.geminiProvider.generate.bind(this.geminiProvider),
        breakerOptions,
      ),
    });

    // Setup logging for breakers
    this.providers.forEach(({ provider, breaker }) => {
      breaker.on('open', () => this.logger.warn(`Circuit Breaker OPEN for ${provider.name}`));
      breaker.on('halfOpen', () =>
        this.logger.log(`Circuit Breaker HALF_OPEN for ${provider.name}`),
      );
      breaker.on('close', () => this.logger.log(`Circuit Breaker CLOSED for ${provider.name}`));
    });
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    let lastError: Error | null = null;

    for (const { provider, breaker } of this.providers) {
      // Skip if breaker is open
      if (breaker.opened) {
        this.logger.warn(`Skipping provider ${provider.name} because its circuit breaker is OPEN`);
        continue;
      }

      try {
        this.logger.log(`Attempting generation with provider: ${provider.name}`);
        return (await breaker.fire(request)) as LlmResponse;
      } catch (error) {
        lastError = error;

        // If it's an abort error, stop everything
        if (error.name === 'AbortError' || request.signal?.aborted) {
          throw error;
        }

        this.logger.warn(
          `Provider ${provider.name} failed: ${error.message}. Trying next provider...`,
        );
      }
    }

    throw lastError || new Error('All LLM providers failed or are unavailable');
  }

  async embed(text: string): Promise<number[]> {
    const hash = crypto.createHash('sha256').update(text).digest('hex');
    const cacheKey = `embedding:cache:${hash}`;

    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.log('Returning cached embedding');
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Failed to read embedding cache: ${error.message}`);
    }

    if (this.geminiProvider.embed) {
      const embedding = await this.geminiProvider.embed(text);

      try {
        await this.redisService.set(cacheKey, JSON.stringify(embedding), 24 * 60 * 60 * 1000); // 24h cache
      } catch (error) {
        this.logger.warn(`Failed to write embedding cache: ${error.message}`);
      }

      return embedding;
    }
    throw new Error('Embedding provider not available');
  }
}
