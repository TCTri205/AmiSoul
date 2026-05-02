import { Module } from '@nestjs/common';
import { AcePipelineService } from './ace-pipeline.service';
import { Stage0AggregatorModule } from './stages/stage0-aggregator/stage0-aggregator.module';
import { Stage1PerceptionModule } from './stages/stage1-perception/stage1-perception.module';

@Module({
  imports: [
    Stage0AggregatorModule,
    Stage1PerceptionModule,
  ],
  providers: [AcePipelineService],
  exports: [AcePipelineService],
})
export class AceModule {}
