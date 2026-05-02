import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Stage1PerceptionService } from './stage1-perception.service';
import { IdentityService } from './identity.service';
import { CrisisService } from './crisis.service';

@Module({
  imports: [ConfigModule],
  providers: [Stage1PerceptionService, IdentityService, CrisisService],
  exports: [Stage1PerceptionService, IdentityService, CrisisService],
})
export class Stage1PerceptionModule {}
