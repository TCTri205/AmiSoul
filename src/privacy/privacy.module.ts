import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivacyService } from './privacy.service';
import { PrivacyController } from './privacy.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, PrismaModule, RedisModule, AuthModule],
  providers: [PrivacyService],
  controllers: [PrivacyController],
})
export class PrivacyModule {}
