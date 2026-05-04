import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { RedisService } from '../../../redis/redis.service';
import { MessageSentDto, SessionType } from '../../../chat/dto/message.dto';
import { AggregatedMessageBlockDto } from './dto/aggregated-message-block.dto';

@Injectable()
export class Stage0AggregatorService {
  private readonly logger = new Logger(Stage0AggregatorService.name);

  private readonly DEBOUNCE_TIME = 2500; // 2.5s

  private readonly HARD_CAP_TIME = 4000; // 4s

  private readonly MAX_MESSAGES_PER_BLOCK = 10;

  private readonly SUMMARIZATION_THRESHOLD_TOKENS = 800;

  private readonly TOKEN_ESTIMATION_RATIO = 4; // 1 token approx 4 chars

  private readonly BUFFER_TTL_MS = 10000; // 10s safety TTL for Redis list

  private debounceTimers = new Map<string, NodeJS.Timeout>();

  private hardCapTimers = new Map<string, NodeJS.Timeout>();

  private activeControllers = new Map<string, AbortController>();

  private preemptCounts = new Map<string, number>();

  constructor(
    private readonly redisService: RedisService,
    // We will use EventEmitter to pass the block to Stage 1
    // This decouples Stage 0 from Stage 1 implementation
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async aggregateMessage(
    userId: string,
    sessionId: string,
    data: MessageSentDto,
    sessionType: SessionType,
  ) {
    const bufferKey = `buffer:${userId}`;
    const debounceKey = `debounce:${userId}`;

    // 1. Store message in Redis buffer
    const messageItem = JSON.stringify({
      content: data.content,
      metadata: data.metadata,
      timestamp: new Date().toISOString(),
    });
    const currentQueueLength = await this.redisService.rpush(bufferKey, messageItem);

    // 1.5. Preemption Check: If a new message arrives, we might want to abort current pipeline
    await this.handlePreemption(userId);

    // 2. Check if a debounce timer is already running
    const hasDebounce = await this.redisService.exists(debounceKey);

    if (!hasDebounce) {
      // First message in a new block
      this.logger.log(`Starting new message block for user: ${userId}`);
      await this.redisService.set(debounceKey, 'active', this.DEBOUNCE_TIME);

      // Set a safety TTL for the buffer list itself
      await this.redisService.expire(bufferKey, this.BUFFER_TTL_MS);

      // Start Hard Cap timer
      if (this.hardCapTimers.has(userId)) {
        clearTimeout(this.hardCapTimers.get(userId));
      }
      const hardCapTimer = setTimeout(
        () => this.flushBuffer(userId, sessionId, sessionType),
        this.HARD_CAP_TIME,
      );
      this.hardCapTimers.set(userId, hardCapTimer);
    } else {
      // Existing block, reset debounce
      this.logger.debug(`Resetting debounce for user: ${userId}`);
      await this.redisService.expire(debounceKey, this.DEBOUNCE_TIME);
    }

    // 3. Immediate flush if Hard Cap (count) is reached
    if (currentQueueLength >= this.MAX_MESSAGES_PER_BLOCK) {
      this.logger.log(`Hard Cap (count) reached for user: ${userId}. Flushing...`);
      return this.flushBuffer(userId, sessionId, sessionType);
    }

    // 4. Update/Reset local debounce timer
    if (this.debounceTimers.has(userId)) {
      clearTimeout(this.debounceTimers.get(userId));
    }

    const debounceTimer = setTimeout(
      () => this.flushBuffer(userId, sessionId, sessionType),
      this.DEBOUNCE_TIME,
    );
    this.debounceTimers.set(userId, debounceTimer);
  }

  async flushBuffer(userId: string, sessionId: string, sessionType: SessionType) {
    // Clear timers
    if (this.debounceTimers.has(userId)) {
      clearTimeout(this.debounceTimers.get(userId));
      this.debounceTimers.delete(userId);
    }
    if (this.hardCapTimers.has(userId)) {
      clearTimeout(this.hardCapTimers.get(userId));
      this.hardCapTimers.delete(userId);
    }

    const bufferKey = `buffer:${userId}`;
    const debounceKey = `debounce:${userId}`;

    // Get all messages from buffer
    const messagesRaw = await this.redisService.lrange(bufferKey, 0, -1);
    if (messagesRaw.length === 0) return;

    const messages: { content: string; timestamp: string; metadata?: any }[] = messagesRaw.map((m) =>
      JSON.parse(m),
    );

    // Clear Redis
    await this.redisService.del(bufferKey);
    await this.redisService.del(debounceKey);

    // Create AbortController for the new pipeline
    const controller = new AbortController();
    this.activeControllers.set(userId, controller);

    // 4. Join content and check for Wall of Text
    const fullContent = messages.map((m) => {
      const origin = m.metadata?.origin === 'voice' ? '[User Spoke] ' : '';
      return `${origin}${m.content}`;
    }).join('\n');
    const estimatedTokens = fullContent.length / this.TOKEN_ESTIMATION_RATIO;
    const requiresSummarization = estimatedTokens > this.SUMMARIZATION_THRESHOLD_TOKENS;

    const aggregatedBlock: AggregatedMessageBlockDto = {
      userId,
      sessionId,
      messages,
      sessionType,
      fullContent,
      requiresSummarization,
      aggregatedAt: new Date().toISOString(),
      signal: controller.signal,
    };

    this.logger.log(`Aggregated ${messages.length} messages for user: ${userId} [${sessionType}]`);

    // Save to Chat History (T4.1 Complement)
    const historyKey = `chat_history:${userId}`;
    await this.redisService.rpush(historyKey, JSON.stringify({ role: 'user', content: fullContent }));
    await this.redisService.ltrim(historyKey, -20, -1); // Keep last 20 messages

    // Emit event for Stage 1 to consume
    this.eventEmitter.emit('stage0.aggregated', aggregatedBlock);
  }

  private async handlePreemption(userId: string) {
    const existingController = this.activeControllers.get(userId);
    if (!existingController) return;

    try {
      // Get Vibe from Redis for bypass check
      const vibe = await this.redisService.get(`vibe:${userId}`);
      const isExtremeVibe = vibe === 'extreme';

      const count = this.preemptCounts.get(userId) || 0;

      if (isExtremeVibe || count < 2) {
        this.logger.log(
          `Preempting current pipeline for user: ${userId} (Count: ${count}, Vibe: ${vibe})`,
        );
        existingController.abort();
        this.activeControllers.delete(userId);
        this.preemptCounts.set(userId, count + 1);
      } else {
        this.logger.warn(`Preemption limiter active for user: ${userId}. Switching to Batch Mode.`);
        this.eventEmitter.emit('batch_mode.start', {
          userId,
          message: 'Ami đang đọc hết tin của bạn...',
        });
      }
    } catch (error) {
      this.logger.error(`Failed to fetch vibe for preemption check: ${error.message}`);
      // Fallback: apply limiter without bypass if redis fails
      const count = this.preemptCounts.get(userId) || 0;
      if (count < 2) {
        existingController.abort();
        this.activeControllers.delete(userId);
        this.preemptCounts.set(userId, count + 1);
      }
    }
  }

  @OnEvent('pipeline.completed')
  handlePipelineCompleted(payload: { userId: string; status: string }) {
    this.logger.debug(
      `Cleaning up pipeline resources for user: ${payload.userId} (Status: ${payload.status})`,
    );

    // Always delete the controller
    this.activeControllers.delete(payload.userId);

    // Only reset the preempt count if the pipeline actually finished (success or real failure)
    // If it was aborted, we keep the count to enforce the limiter on the next message
    if (payload.status !== 'aborted') {
      this.preemptCounts.set(payload.userId, 0);
    }
  }
}
