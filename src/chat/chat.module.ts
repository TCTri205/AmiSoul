import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';
import { Stage0AggregatorModule } from '../ace/stages/stage0-aggregator/stage0-aggregator.module';

@Module({
  imports: [AuthModule, Stage0AggregatorModule],
  providers: [ChatGateway],
})
export class ChatModule {}
