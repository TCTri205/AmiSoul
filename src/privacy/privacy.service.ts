import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Soft delete all memories and sessions for a user.
   * Data remains in DB but is hidden from retrieval.
   */
  async softDeleteUserData(userId: string): Promise<void> {
    this.logger.log(`Soft deleting data for user ${userId}`);

    await this.prisma.$transaction([
      this.prisma.memory.updateMany({
        where: { userId, isDeleted: false },
        data: { isDeleted: true },
      }),
      this.prisma.session.updateMany({
        where: { userId, isDeleted: false },
        data: { isDeleted: true },
      }),
    ]);

    // Clear CAL context from Redis (Vector Sync requirement)
    await this.clearRedisCache(userId);

    this.logger.log(`Soft delete completed for user ${userId}`);
  }

  /**
   * Hard delete all memories and sessions for a user.
   * Data is permanently removed from DB.
   */
  async hardDeleteUserData(userId: string): Promise<void> {
    this.logger.warn(`HARD DELETING data for user ${userId}`);

    await this.prisma.$transaction([
      this.prisma.memory.deleteMany({
        where: { userId },
      }),
      this.prisma.session.deleteMany({
        where: { userId },
      }),
    ]);

    // Clear CAL context from Redis
    await this.clearRedisCache(userId);

    this.logger.log(`Hard delete completed for user ${userId}`);
  }

  /**
   * Clears all privacy-sensitive cache keys for a user from Redis.
   */
  private async clearRedisCache(userId: string): Promise<void> {
    const keys = [
      `cal:expectations:${userId}`,
      `cal:pending:${userId}`,
      `cal:dates:${userId}`,
      `chat_history:${userId}`,
      `vibe:${userId}`,
    ];

    for (const key of keys) {
      await this.redis.del(key);
    }
    
    this.logger.debug(`Cleared Redis privacy cache for user ${userId}`);
  }

  /**
   * Export all user data as JSON (GDPR requirement).
   */
  async exportUserData(userId: string): Promise<any> {
    this.logger.log(`Exporting data for user ${userId}`);

    const [user, memories, sessions] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        include: { behavioralBaseline: true },
      }),
      this.prisma.memory.findMany({
        where: { userId, isDeleted: false },
      }),
      this.prisma.session.findMany({
        where: { userId, isDeleted: false },
        include: { messages: true },
      }),
    ]);

    return {
      profile: user,
      memories,
      sessions,
      exportedAt: new Date().toISOString(),
    };
  }
}
