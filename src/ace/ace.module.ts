import { Module } from '@nestjs/common';
import { AcePipelineService } from './ace-pipeline.service';
import { Stage0AggregatorModule } from './stages/stage0-aggregator/stage0-aggregator.module';
import { Stage1PerceptionModule } from './stages/stage1-perception/stage1-perception.module';
import { ContextRetrieverModule } from './stages/stage2-context-retriever/context-retriever.module';
import { PerceptionMiddleware } from './middleware/perception.middleware';


@Module({
  imports: [
    Stage0AggregatorModule,
    Stage1PerceptionModule,
    ContextRetrieverModule,
  ],
  providers: [AcePipelineService, PerceptionMiddleware],
  exports: [AcePipelineService, PerceptionMiddleware],
})
export class AceModule {}
