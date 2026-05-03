export interface LlmRequest {
  systemPrompt?: string;
  userPrompt: string;
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  signal?: AbortSignal;
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

export interface ILlmProvider {
  readonly name: string;
  generate(request: LlmRequest): Promise<LlmResponse>;
  embed?(text: string): Promise<number[]>;
}
