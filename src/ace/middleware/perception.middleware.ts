import { Injectable, Logger } from '@nestjs/common';
import { PerceptionResultDto } from '../stages/stage1-perception/dto/perception-result.dto';
import { AggregatedMessageBlockDto } from '../stages/stage0-aggregator/dto/aggregated-message-block.dto';
import { CognitiveContext } from './dto/cognitive-context.dto';

@Injectable()
export class PerceptionMiddleware {
  private readonly logger = new Logger(PerceptionMiddleware.name);

  /**
   * Transforms raw Stage 1 output into a standardized CognitiveContext
   */
  transform(
    rawGeminiOutput: string,
    payload: AggregatedMessageBlockDto,
    existingPerception?: PerceptionResultDto,
  ): CognitiveContext {
    this.logger.log(`Transforming Stage 1 output for user: ${payload.userId}`);

    let perception: PerceptionResultDto;

    try {
      // 1. Robust JSON Extraction
      const parsedPerception = this.extractJson(rawGeminiOutput);

      // Merge: Heuristics from existingPerception should take precedence for safety flags
      perception = existingPerception
        ? { ...existingPerception, ...parsedPerception }
        : parsedPerception;

      // Special handling: if heuristics triggered safety flags, keep them true even if LLM said false
      if (existingPerception) {
        perception.is_crisis = existingPerception.is_crisis || perception.is_crisis;
        perception.is_injection = existingPerception.is_injection || perception.is_injection;

        if (existingPerception.injection_reason && !perception.injection_reason) {
          perception.injection_reason = existingPerception.injection_reason;
        }

        // Maintain high urgency if safety flags are true
        if (perception.is_crisis || perception.is_injection) {
          perception.urgency = Math.max(perception.urgency || 0, 10);
        }
      }
    } catch (error) {
      this.logger.error(`Failed to parse perception JSON: ${error.message}. Using fallback.`);
      perception = existingPerception || this.getFallbackPerception();
    }

    // 2. Normalize Sentiment
    const normalizedSentiment = this.normalizeSentiment(perception.sentiment);

    // 3. Determine Routing Path
    const routingPath = this.determineRouting(perception);

    // 4. Package Context
    return new CognitiveContext({
      userId: payload.userId,
      sessionId: payload.sessionId,
      rawInput: payload.fullContent,
      perception,
      normalizedSentiment,
      routingPath,
      summary: perception.summary,
    });
  }

  /**
   * Uses regex to find and parse JSON blocks even if Gemini adds conversational filler.
   */
  private extractJson(text: string): PerceptionResultDto {
    // Look for JSON block wrapped in triple backticks or just the raw object
    const jsonMatch = text.match(/(\{[\s\S]*\})/);

    if (!jsonMatch) {
      throw new Error('No JSON object found in text');
    }

    const cleanedJson = jsonMatch[1]
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleanedJson) as PerceptionResultDto;
  }

  /**
   * Maps 'positive' -> 1.0, 'neutral' -> 0.0, 'negative' -> -1.0
   * Case-insensitive to handle model variations.
   */
  private normalizeSentiment(sentiment: string): number {
    if (!sentiment) return 0.0;

    const normalized = sentiment.toLowerCase().trim();
    switch (normalized) {
      case 'positive':
        return 1.0;
      case 'negative':
        return -1.0;
      case 'neutral':
      default:
        return 0.0;
    }
  }

  /**
   * Core routing decision logic with safe defaults.
   */
  private determineRouting(perception: PerceptionResultDto): 'fast' | 'full' {
    // Logic from AcePipelineService: complexity > 7 || routing_confidence < 0.85 || urgency > 8
    // Using safe defaults if fields are missing (confidence 0 = full path)
    const complexity = perception.complexity ?? 5;
    const confidence = perception.routing_confidence ?? 0;
    const urgency = perception.urgency ?? 5;

    const isTimeAnomaly = typeof perception.timestamp_flag === 'string';

    const isComplex = complexity > 7 || confidence < 0.85 || urgency > 8 || isTimeAnomaly;

    return isComplex ? 'full' : 'fast';
  }

  private getFallbackPerception(): PerceptionResultDto {
    return {
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
    };
  }
}
