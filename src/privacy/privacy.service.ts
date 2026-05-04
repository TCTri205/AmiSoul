import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class PrivacyService {
  private readonly logger = new Logger(PrivacyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Soft delete all memories and sessions for a user.
   * Data remains in DB but is hidden from retrieval.
   */
  async softDeleteUserData(userId: string): Promise<void> {
    const configValue = this.configService.get('SOFT_DELETE_ENABLED');
    const isSoftDeleteEnabled = configValue === true || configValue === 'true' || configValue === undefined;

    if (!isSoftDeleteEnabled) {
      this.logger.warn(`Soft delete requested but SOFT_DELETE_ENABLED is false for user ${userId}. Falling back to hard delete.`);
      return this.hardDeleteUserData(userId);
    }

    this.logger.log(`AUDIT: Soft deleting data for user ${userId}`);

    const [memories, sessions] = await this.prisma.$transaction([
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

    this.logger.log(`AUDIT: Soft delete completed for user ${userId}. Affected: ${memories.count} memories, ${sessions.count} sessions.`);
  }

  /**
   * Hard delete all memories and sessions for a user.
   * Data is permanently removed from DB.
   */
  async hardDeleteUserData(userId: string): Promise<void> {
    this.logger.warn(`AUDIT: HARD DELETING data for user ${userId}`);

    const [memories, sessions] = await this.prisma.$transaction([
      this.prisma.memory.deleteMany({
        where: { userId },
      }),
      this.prisma.session.deleteMany({
        where: { userId },
      }),
      this.prisma.behavioralBaseline.deleteMany({
        where: { userId },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: {
          bondingScore: 0,
          dpe: null,
        },
      }),
    ]);

    // Clear CAL context from Redis
    await this.clearRedisCache(userId);

    this.logger.log(`AUDIT: Hard delete completed for user ${userId}. Removed: ${memories.count} memories, ${sessions.count} sessions.`);
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
      `user:behavioral_signature:${userId}`,
      `buffer:${userId}`,
      `debounce:${userId}`,
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
        orderBy: { createdAt: 'desc' },
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

  /**
   * Delete a single memory record.
   */
  async deleteMemory(userId: string, memoryId: string): Promise<void> {
    this.logger.log(`AUDIT: Deleting single memory ${memoryId} for user ${userId}`);
    
    await this.prisma.memory.delete({
      where: { id: memoryId, userId },
    });
    
    // Clear Redis as memory change might affect CAL context
    await this.clearRedisCache(userId);
  }
}
