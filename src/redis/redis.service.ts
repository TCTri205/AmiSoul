import { Injectable, Inject, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.redisClient.get(key);
  }

  async set(key: string, value: string, ttlMs?: number): Promise<void> {
    if (ttlMs) {
      await this.redisClient.set(key, value, 'PX', ttlMs);
    } else {
      await this.redisClient.set(key, value);
    }
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async exists(key: string): Promise<boolean> {
    const result = await this.redisClient.exists(key);
    return result === 1;
  }

  async expire(key: string, ms: number): Promise<void> {
    await this.redisClient.pexpire(key, ms);
  }

  async rpush(key: string, value: string): Promise<number> {
    return this.redisClient.rpush(key, value);
  }

  async llen(key: string): Promise<number> {
    return this.redisClient.llen(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.redisClient.lrange(key, start, stop);
  }

  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.redisClient.ltrim(key, start, stop);
  }

  async multi() {
    return this.redisClient.multi();
  }

  onModuleDestroy() {
    this.redisClient.disconnect();
  }

  getClient(): Redis {
    return this.redisClient;
  }
}
