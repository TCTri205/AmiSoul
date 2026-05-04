import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiProvider } from './providers/gemini.provider';
import { GroqProvider } from './providers/groq.provider';
import { LlmOrchestrator } from './llm-orchestrator.service';

@Module({
  imports: [ConfigModule],
  providers: [GeminiProvider, GroqProvider, LlmOrchestrator],
  exports: [LlmOrchestrator, GeminiProvider, GroqProvider],
})
export class AiProviderModule {}
