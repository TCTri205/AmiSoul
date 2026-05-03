import { Injectable, Logger } from '@nestjs/common';
import { OnEvent, EventEmitter2 } from '@nestjs/event-emitter';
import { AggregatedMessageBlockDto } from './stages/stage0-aggregator/dto/aggregated-message-block.dto';
import { Stage1PerceptionService } from './stages/stage1-perception/stage1-perception.service';
import { PerceptionResultDto } from './stages/stage1-perception/dto/perception-result.dto';
import { IdentityService } from './stages/stage1-perception/identity.service';
import { CrisisService } from './stages/stage1-perception/crisis.service';
import { PrismaService } from '../prisma/prisma.service';
import { PerceptionMiddleware } from './middleware/perception.middleware';
import { CognitiveContext } from './middleware/dto/cognitive-context.dto';
import { ContextRetrieverService } from './stages/stage2-context-retriever/context-retriever.service';
import { SimulationService } from './stages/stage3-simulation/simulation.service';

@Injectable()
export class AcePipelineService {
  private readonly logger = new Logger(AcePipelineService.name);

  constructor(
    private readonly stage1: Stage1PerceptionService,
    private readonly stage2: ContextRetrieverService,
    private readonly stage3: SimulationService,
    private readonly identityService: IdentityService,
    private readonly crisisService: CrisisService,
    private readonly perceptionMiddleware: PerceptionMiddleware,
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @OnEvent('stage0.aggregated')
  async handleAggregatedBlock(payload: AggregatedMessageBlockDto) {
    const { userId, signal } = payload;
    let status: 'success' | 'aborted' | 'failed' = 'success';

    try {
      this.logger.log(`Starting ACE Pipeline for user: ${userId}`);

      // Stage 1: Perception (Router)
      const stage1Response = await this.stage1.process(payload, signal);

      // Middleware: Transform & Normalize (T2.6)
      const context = this.perceptionMiddleware.transform(
        stage1Response.rawResponse,
        payload,
        stage1Response.perception,
      );

      // Behavioral Identity Check (T2.3)
      await this.performIdentityCheck(payload, context.perception);

      // Heuristic Crisis Override (T2.4)
      if (context.perception.is_crisis) {
        this.logger.warn(`Crisis detected for user ${userId}. Triggering Safety Override.`);
        await this.runSafetyOverride(payload, context.perception);
        return;
      }

      // Security Injection Override (T2.5)
      if (context.perception.is_injection) {
        this.logger.warn(
          `Prompt Injection detected for user ${userId}. Triggering Security Override.`,
        );
        await this.runSecurityOverride(payload, context.perception);
        return;
      }

      // Routing Decision (T2.6 - Decision logic moved to middleware)
      if (context.routingPath === 'full') {
        await this.runFullCognitivePath(context, signal);
      } else {
        await this.runFastPath(context, signal);
      }

      this.logger.log(
        `ACE Pipeline completed successfully for user: ${userId} (${context.routingPath?.toUpperCase() || 'UNKNOWN'} Path)`,
      );
    } catch (error) {
      if (error.message === 'AbortError' || error.name === 'AbortError' || signal?.aborted) {
        this.logger.warn(`ACE Pipeline aborted for user: ${userId}`);
        status = 'aborted';
      } else {
        this.logger.error(`ACE Pipeline failed for user: ${userId}`, error.stack);
        status = 'failed';
      }
    } finally {
      this.eventEmitter.emit('pipeline.completed', { userId, status });
    }
  }

  /**
   * Full Cognitive Path: Stage 1 -> Stage 2 (Retrieval) -> Stage 3 (LLM) -> Stage 4 (Monitor)
   */
  private async runFullCognitivePath(context: CognitiveContext, signal?: AbortSignal) {
    const { userId } = context;
    this.logger.log(
      `Routing user ${userId} to FULL COGNITIVE PATH (Confidence: ${context.perception.routing_confidence})`,
    );

    // Stage 2: Context Retrieval (CMA + CAL)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 2: Retrieving deep context for user: ${userId}`);
    const retrievedContext = await this.stage2.retrieve(context, signal);

    this.logger.log(
      `Stage 2: Successfully retrieved context for user ${userId} (${retrievedContext.memories.length} memories, ${retrievedContext.calEvents.length} CAL events)`,
    );

    // Stage 3: LLM Simulation (Full Reasoning)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 3: Simulating empathetic response for user: ${userId}`);
    await this.stage3.simulate(context, retrievedContext, signal);

    // Stage 4: Vibe & Safety Monitor
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 4: Monitoring session vibe for user: ${userId}`);
    // [TODO] Call Stage 4 Service with context
  }

  /**
   * Fast Path: Stage 1 -> Stage 3 (Fast Response) -> Stage 4 (Sync)
   * Skips deep retrieval to reduce latency for simple interactions.
   */
  private async runFastPath(context: CognitiveContext, signal?: AbortSignal) {
    const { userId } = context;
    this.logger.log(
      `Routing user ${userId} to FAST PATH (Confidence: ${context.perception.routing_confidence})`,
    );

    // Stage 2: Skip or minimal retrieval
    this.logger.debug(`Stage 2: Performing minimal retrieval for fast path (User: ${userId})`);
    const retrievedContext = await this.stage2.retrieve(context, signal); // Even fast path might need some CAL context

    // Stage 3: Fast Simulation (Small model or direct response)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 3: Generating fast response for user: ${userId}`);
    await this.stage3.simulate(context, retrievedContext, signal);

    // Stage 4: Monitor (Still needed for safety)
    if (signal?.aborted) throw new Error('AbortError');
    this.logger.debug(`Stage 4: Monitoring fast session for user: ${userId}`);
    // [TODO] Call Stage 4 Service with context
  }

  /**
   * Helper to perform behavioral identity check and update perception metadata
   */
  private async performIdentityCheck(
    payload: AggregatedMessageBlockDto,
    perception: PerceptionResultDto,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.userId },
        select: { bondingScore: true },
      });

      if (!user) {
        this.logger.warn(`User ${payload.userId} not found during identity check`);
        return;
      }

      const identityResult = await this.identityService.calculateAnomaly(
        payload.userId,
        payload,
        user.bondingScore,
      );

      // If behavioral deviation is high (> 0.7), flag as anomaly
      if (!identityResult.isBypassed && identityResult.anomalyScore > 0.7) {
        this.logger.warn(
          `Identity Anomaly Detected for user ${payload.userId} (Score: ${identityResult.anomalyScore.toFixed(2)})`,
        );
        perception.identity_anomaly = true;

        // Emit specific event for Gateway/Monitor to react (T2.3)
        this.eventEmitter.emit('identity.anomaly', {
          userId: payload.userId,
          score: identityResult.anomalyScore,
          metrics: identityResult.metrics,
        });
      }

      // Update behavioral baseline in background if no anomaly is suspected (by both LLM and Heuristics)
      if (!perception.identity_anomaly && !identityResult.isBypassed) {
        this.identityService
          .updateSignature(payload.userId, payload)
          .catch((err) =>
            this.logger.error(
              `Failed to update behavioral signature for ${payload.userId}: ${err.message}`,
            ),
          );
      }
    } catch (error) {
      this.logger.error(
        `Error in performIdentityCheck for user ${payload.userId}: ${error.message}`,
      );
    }
  }

  /**
   * Safety Override: Bypasses simulation and provides support resources immediately.
   */
  private async runSafetyOverride(
    payload: AggregatedMessageBlockDto,
    perception: PerceptionResultDto,
  ) {
    const { userId } = payload;

    const safetyMessage = this.crisisService.getSafetyResponse();

    // Emit safety override event (ChatGateway will listen and send to socket)
    this.eventEmitter.emit('pipeline.safety_override', {
      userId,
      content: safetyMessage,
      perception,
    });

    this.logger.log(`Safety Override completed for user: ${userId}`);
  }

  /**
   * Security Override: Bypasses simulation when injection is detected.
   */
  private async runSecurityOverride(
    payload: AggregatedMessageBlockDto,
    perception: PerceptionResultDto,
  ) {
    const { userId } = payload;

    const securityMessage =
      'Tôi xin lỗi, nhưng tôi không thể thực hiện yêu cầu này vì nó vi phạm chính sách an toàn hoặc chứa các chỉ lệnh không phù hợp. Hãy trò chuyện với tôi một cách tự nhiên nhé! 😊';

    // Log the attack attempt with the specific reason
    this.logger.warn(
      `SECURITY ALERT: Prompt Injection attempt by user ${userId}. Reason: ${perception.injection_reason}. Content: "${payload.fullContent?.substring(0, 100) || 'N/A'}..."`,
    );

    // Emit security override event
    this.eventEmitter.emit('pipeline.security_override', {
      userId,
      content: securityMessage,
      perception,
    });

    this.logger.log(`Security Override completed for user: ${userId}`);
  }
}
