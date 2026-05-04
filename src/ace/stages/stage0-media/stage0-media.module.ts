import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MediaProcessingService } from './media-processing.service';
import { AiProviderModule } from '../../../ai-provider/ai-provider.module';

@Module({
  imports: [AiProviderModule, ConfigModule],
  providers: [MediaProcessingService],
  exports: [MediaProcessingService],
})
export class Stage0MediaModule {}