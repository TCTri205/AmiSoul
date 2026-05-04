import { Observable } from 'rxjs';

export interface LlmRequest {
  model?: string;
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  signal?: AbortSignal;
  mediaData?: {
    data: string;
    mimeType: string;
  };
}

export interface LlmResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
}

export interface LlmStreamChunk {
  text: string;
  isComplete: boolean;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
}

export interface ILlmProvider {
  readonly name: string;
  generate(request: LlmRequest): Promise<LlmResponse>;
  generateStream(request: LlmRequest): Observable<LlmStreamChunk>;
  embed?(text: string): Promise<number[]>;
}
