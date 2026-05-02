import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Stage1PerceptionService } from './stage1-perception.service';

@Module({
  imports: [ConfigModule],
  providers: [Stage1PerceptionService],
  exports: [Stage1PerceptionService],
})
export class Stage1PerceptionModule {}
