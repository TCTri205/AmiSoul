import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Search for similar memories using vector similarity.
   * @param userId The user ID to search for memories
   * @param vector The query vector (embedding)
   * @param limit The maximum number of results (default 5)
   */
  async searchSimilarMemories(userId: string, vector: number[], limit: number = 5) {
    const vectorString = `[${vector.join(',')}]`;

    return this.$queryRaw<any[]>`
      SELECT 
        id, 
        content, 
        metadata, 
        sensitivity_level as "sensitivityLevel",
        created_at as "createdAt",
        1 - (embedding <=> ${vectorString}::vector) as similarity
      FROM memories
      WHERE user_id = ${userId}
      ORDER BY similarity DESC
      LIMIT ${limit};
    `;
  }
}
