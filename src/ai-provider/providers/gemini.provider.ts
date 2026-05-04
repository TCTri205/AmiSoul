import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { Observable } from 'rxjs';
import {
  ILlmProvider,
  LlmRequest,
  LlmResponse,
  LlmStreamChunk,
} from '../interfaces/llm-provider.interface';

@Injectable()
export class GeminiProvider implements ILlmProvider {
  private readonly logger = new Logger(GeminiProvider.name);

  public readonly name = 'gemini';

  private apiKeys: string[] = [];

  private currentKeyIndex = 0;

  constructor(private readonly configService: ConfigService) {
    const keysStr =
      this.configService.get<string>('GEMINI_API_KEYS') ||
      this.configService.get<string>('GEMINI_API_KEY');
    if (keysStr) {
      this.apiKeys = keysStr
        .split(',')
        .map((k) => k.trim())
        .filter((k) => k.length > 0);
    }

    if (this.apiKeys.length === 0) {
      this.logger.warn('No Gemini API keys found in configuration');
    }
  }

  async generate(request: LlmRequest): Promise<LlmResponse> {
    if (this.apiKeys.length === 0) {
      throw new Error('Gemini API keys not configured');
    }

    const attempts = this.apiKeys.length;
    let lastError: any;

    for (let i = 0; i < attempts; i++) {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      try {
        const modelName = request.model || 'gemini-1.5-flash';
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: modelName,
          systemInstruction: request.systemPrompt,
          generationConfig: {
            responseMimeType: request.responseFormat === 'json' ? 'application/json' : 'text/plain',
            temperature: request.temperature,
            maxOutputTokens: request.maxTokens,
          },
        });

        const parts: any[] = [{ text: request.userPrompt }];
        if (request.mediaData) {
          parts.push({
            inlineData: {
              data: request.mediaData.data,
              mimeType: request.mediaData.mimeType,
            },
          });
        }

        const result = await model.generateContent(parts, { signal: request.signal });
        const response = await result.response;
        const text = response.text();

        return {
          text,
          provider: this.name,
          model: modelName,
          usage: {
            promptTokens: response.usageMetadata?.promptTokenCount || 0,
            completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata?.totalTokenCount || 0,
          },
        };
      } catch (error) {
        lastError = error;

        // Check for rate limit error (429)
        if (
          error.status === 429 ||
          error.message?.includes('429') ||
          error.message?.includes('Too Many Requests')
        ) {
          this.logger.warn(`Gemini API key ${this.currentKeyIndex} rate limited. Rotating...`);
          this.rotateKey();
          continue;
        }

        // If it's an abort error, don't retry
        if (error.name === 'AbortError' || request.signal?.aborted) {
          throw error;
        }

        // For other errors, we might still want to try another key or just fail
        this.logger.error(`Gemini API error with key ${this.currentKeyIndex}: ${error.message}`);
        this.rotateKey();
      }
    }

    throw lastError;
  }

  generateStream(request: LlmRequest): Observable<LlmStreamChunk> {
    return new Observable<LlmStreamChunk>((subscriber) => {
      if (this.apiKeys.length === 0) {
        subscriber.error(new Error('Gemini API keys not configured'));
        return;
      }

      const apiKey = this.apiKeys[this.currentKeyIndex];
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: request.systemPrompt,
        generationConfig: {
          responseMimeType: request.responseFormat === 'json' ? 'application/json' : 'text/plain',
          temperature: request.temperature,
          maxOutputTokens: request.maxTokens,
        },
      });

      const startStream = async () => {
        try {
          const result = await model.generateContentStream(request.userPrompt, {
            signal: request.signal,
          });

          for await (const chunk of result.stream) {
            if (request.signal?.aborted) {
              subscriber.error(new Error('AbortError'));
              return;
            }

            const chunkText = chunk.text();
            subscriber.next({
              text: chunkText,
              isComplete: false,
              provider: this.name,
              model: 'gemini-2.5-flash',
            });
          }

          const response = await result.response;
          subscriber.next({
            text: '',
            isComplete: true,
            provider: this.name,
            model: 'gemini-2.5-flash',
            usage: {
              promptTokens: response.usageMetadata?.promptTokenCount || 0,
              completionTokens: response.usageMetadata?.candidatesTokenCount || 0,
              totalTokens: response.usageMetadata?.totalTokenCount || 0,
            },
          });
          subscriber.complete();
        } catch (error) {
          if (error.name === 'AbortError' || request.signal?.aborted) {
            subscriber.error(error);
          } else if (
            error.status === 429 ||
            error.message?.includes('429') ||
            error.message?.includes('Too Many Requests')
          ) {
            this.logger.warn(`Gemini API key ${this.currentKeyIndex} rate limited. Rotating...`);
            this.rotateKey();
            // In a stream, we might not be able to retry as easily without restarting the whole stream
            // For now, just error out so the orchestrator can decide
            subscriber.error(error);
          } else {
            this.logger.error(`Gemini Stream error with key ${this.currentKeyIndex}: ${error.message}`);
            subscriber.error(error);
          }
        }
      };

      startStream();
    });
  }

  async embed(text: string): Promise<number[]> {
    if (this.apiKeys.length === 0) {
      throw new Error('Gemini API keys not configured');
    }

    const attempts = this.apiKeys.length;
    let lastError: any;

    for (let i = 0; i < attempts; i++) {
      const apiKey = this.apiKeys[this.currentKeyIndex];
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent(text);
        return result.embedding.values;
      } catch (error) {
        lastError = error;

        if (error.status === 429 || error.message?.includes('429')) {
          this.logger.warn(
            `Gemini Embedding key ${this.currentKeyIndex} rate limited. Rotating...`,
          );
          this.rotateKey();
          continue;
        }

        this.logger.error(
          `Gemini Embedding error with key ${this.currentKeyIndex}: ${error.message}`,
        );
        this.rotateKey();
      }
    }

    throw lastError;
  }

  private rotateKey() {
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
  }
}
