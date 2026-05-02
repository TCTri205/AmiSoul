import { Module } from '@nestjs/common';
import { Stage1PerceptionService } from './stage1-perception.service';

@Module({
  providers: [Stage1PerceptionService],
  exports: [Stage1PerceptionService],
})
export class Stage1PerceptionModule {}
