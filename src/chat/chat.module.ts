import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { Stage0AggregatorModule } from '../ace/stages/stage0-aggregator/stage0-aggregator.module';
import { Stage0MediaModule } from '../ace/stages/stage0-media/stage0-media.module';

@Module({
  imports: [AuthModule, Stage0AggregatorModule, Stage0MediaModule],
  providers: [ChatGateway],
})
export class ChatModule {}
