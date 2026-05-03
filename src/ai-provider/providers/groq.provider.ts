import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { ILlmProvider, LlmRequest, LlmResponse } from '../interfaces/llm-provider.interface';

@Injectable()
export class GroqProvider implements ILlmProvider {
  private readonly logger = new Logger(GroqProvider.name);
  public readonly name = 'groq';
  private apiKeys: string[] = [];
  private currentKeyIndex = 0;

  constructor(private readonly configService: ConfigService) {
    const keysStr = this.configService.get<string>('GROQ_API_KEYS') || this.configService.get<string>('GROQ_API_KEY');
    if (keysStr) {
      this.apiKeys = keysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
    }

    if (this.apiKeys.length === 0) {
      this.logger.warn('No Groq API keys found in configuration');
    }
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    if (this.apiKeys.length === 0) {
      throw new Error('Groq API keys not configured');
    }

    const attempts = this.apiKeys.length;
    let lastError: any;

    for (let i = 0; i < attempts; i++) {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      try {
        const groq = new Groq({ apiKey });
        
        const messages: any[] = [];
        if (request.systemPrompt) {
          messages.push({ role: 'system', content: request.systemPrompt });
        }
        messages.push({ role: 'user', content: request.userPrompt });

        const completion = await groq.chat.completions.create({
          messages,
          model: 'llama-3.3-70b-versatile',
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens,
          response_format: request.responseFormat === 'json' ? { type: 'json_object' } : undefined,
        }, { signal: request.signal });

        const text = completion.choices[0]?.message?.content || '';

        return {
          text,
          provider: this.name,
          model: 'llama-3.3-70b-versatile',
          usage: {
            promptTokens: completion.usage?.prompt_tokens || 0,
            completionTokens: completion.usage?.completion_tokens || 0,
            totalTokens: completion.usage?.total_tokens || 0,
          },
        };
      } catch (error) {
        lastError = error;

        // Check for rate limit error (429)
        if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Too Many Requests')) {
          this.logger.warn(`Groq API key ${this.currentKeyIndex} rate limited. Rotating...`);
          this.rotateKey();
          continue;
        }

        // If it's an abort error, don't retry
        if (error.name === 'AbortError' || request.signal?.aborted) {
          throw error;
        }

        this.logger.error(`Groq API error with key ${this.currentKeyIndex}: ${error.message}`);
        this.rotateKey();
      }
    }

    throw lastError;
  }

  private rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  }
}
