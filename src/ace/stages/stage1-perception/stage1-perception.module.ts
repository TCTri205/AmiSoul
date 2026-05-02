import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Stage1PerceptionService } from './stage1-perception.service';
import { IdentityService } from './identity.service';

@Module({
  imports: [ConfigModule],
  providers: [Stage1PerceptionService, IdentityService],
  exports: [Stage1PerceptionService, IdentityService],
})
export class Stage1PerceptionModule {}
