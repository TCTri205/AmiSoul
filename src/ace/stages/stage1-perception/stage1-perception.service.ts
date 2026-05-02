import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import CircuitBreaker from 'opossum';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';
import { PerceptionResultDto } from './dto/perception-result.dto';

@Injectable()
export class Stage1PerceptionService implements OnModuleInit {
  private readonly logger = new Logger(Stage1PerceptionService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private breaker: CircuitBreaker;

  constructor(private readonly configService: ConfigService) { }

  onModuleInit() {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not defined in configuration');
      return;
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    // Configure Circuit Breaker
    const options = {
      timeout: 5000, // 5 seconds timeout
      errorThresholdPercentage: 50,
      resetTimeout: 30000, // 30 seconds before trying again
      volumeThreshold: 10, // Minimum requests before circuit breaker can trip
    };

    // Note: opossum expects a function that returns a Promise
    this.breaker = new CircuitBreaker(this.callGeminiInternal.bind(this), options);

    this.breaker.on('open', () => this.logger.warn('Circuit Breaker OPEN for Gemini API'));
    this.breaker.on('halfOpen', () => this.logger.log('Circuit Breaker HALF_OPEN for Gemini API'));
    this.breaker.on('close', () => this.logger.log('Circuit Breaker CLOSED for Gemini API'));
  }

  async process(payload: AggregatedMessageBlockDto, signal?: AbortSignal): Promise<PerceptionResultDto> {
    this.logger.log(`Stage 1: Processing perception for user ${payload.userId}`);

    try {
      const result = await this.executeWithRetry(payload, signal);
      this.logger.log(`Stage 1: Completed for user ${payload.userId}`);
      return result;
    } catch (error) {
      if (error.message === 'AbortError') {
        this.logger.warn(`Stage 1 Aborted for user ${payload.userId}`);
        throw error;
      }
      this.logger.error(`Stage 1 Failed for user ${payload.userId}: ${error.message}`);
      // Fallback result in case of failure
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
      };
    }
  }

  private async executeWithRetry(payload: AggregatedMessageBlockDto, signal?: AbortSignal, attempts = 3): Promise<PerceptionResultDto> {
    let lastError: Error;

    for (let i = 0; i < attempts; i++) {
      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      try {
        // The fire method passes arguments to the protected function (callGeminiInternal)
        return await this.breaker.fire(payload, signal);
      } catch (error) {
        lastError = error;

        // If it's a circuit breaker error (Open) or AbortError, don't retry
        if (error.message === 'AbortError' || this.breaker.opened) {
          throw error;
        }

        this.logger.warn(`Gemini API attempt ${i + 1} failed: ${error.message}. Retrying...`);

        if (i < attempts - 1) {
          // Exponential backoff
          const delay = 500 * (i + 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }

  /**
   * Internal method called by the Circuit Breaker
   */
  private async callGeminiInternal(payload: AggregatedMessageBlockDto, signal?: AbortSignal): Promise<PerceptionResultDto> {
    const isLongBlock = payload.fullContent.length > 2500; // Rough estimate for 800-1000 tokens
    
    const systemPrompt = `
      You are the Perception Layer (Stage 1) of AmiSoul, an empathetic AI companion.
      Your task is to analyze the user's message block and extract metadata for pipeline routing.
      
      Output ONLY a JSON object matching this schema:
      {
        "intent": "greeting" | "question" | "venting" | "sharing" | "seeking_advice" | "closing" | "forget_me" | "delete_memory" | "factual_query" | "unknown",
        "sentiment": "positive" | "neutral" | "negative",
        "complexity": number (1-10),
        "urgency": number (1-10),
        "identity_anomaly": boolean (true if tone is erratic or uncharacteristic),
        "routing_confidence": number (0.0-1.0, how sure you are about the intent/routing),
        "sarcasm_hint": boolean,
        "timestamp_flag": boolean (true if the user mentions time, dates, or schedules),
        "noise_flag": boolean (true if the input is gibberish, empty, or just symbols),
        "summary": "string" (ONLY provide a 1-sentence summary if requested)
      }

      Context/Instructions:
      - 'forget_me' / 'delete_memory': Use if user wants to wipe data or stop being remembered.
      - 'factual_query': Use for non-emotional, data-seeking questions (e.g., "What is 2+2?").
      - 'routing_confidence': If the user is vague, set this < 0.85.
      - ${isLongBlock ? 'MANDATORY: Provide a concise 1-sentence summary of the main points.' : 'Omit the summary field unless the content is exceptionally dense.'}
      
      User message block:
      """
      ${payload.fullContent}
      """
    `;

    try {
      const result = await this.model.generateContent(systemPrompt, { signal });
      const response = await result.response;
      const text = response.text();

      try {
        // Robust JSON parsing: handle potential markdown wrapping if it occurs
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanedText) as PerceptionResultDto;
      } catch (e) {
        this.logger.error(`Failed to parse Gemini response: ${text}`);
        throw new Error('Invalid response format from AI');
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.message?.includes('AbortError')) {
        throw new Error('AbortError');
      }
      throw error;
    }
  }
}
