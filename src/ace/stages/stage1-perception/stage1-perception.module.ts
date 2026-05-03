import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Stage1PerceptionService } from './stage1-perception.service';
import { IdentityService } from './identity.service';
import { CrisisService } from './crisis.service';
import { InjectionDetectionService } from './injection-detection.service';
import { TimeAnomalyService } from './time-anomaly.service';
import { AiProviderModule } from '../../../ai-provider/ai-provider.module';

@Module({
  imports: [ConfigModule, AiProviderModule],
  providers: [Stage1PerceptionService, IdentityService, CrisisService, InjectionDetectionService, TimeAnomalyService],
  exports: [Stage1PerceptionService, IdentityService, CrisisService, InjectionDetectionService, TimeAnomalyService],
})
export class Stage1PerceptionModule {}
