import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { EncryptionUtil } from './encryption.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private readonly encryptionKey: string;
  private _extendedClient: any;

  constructor(private configService: ConfigService) {
    const connectionString = configService.get<string>('DATABASE_URL');
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    super({ adapter });

    this.encryptionKey = this.configService.get<string>('ENCRYPTION_KEY') || 'default-secret-key-change-me';
  }

  async onModuleInit() {
    await this.$connect();
    this.setupExtensions();
  }

  private setupExtensions() {
    const key = this.encryptionKey;

    this._extendedClient = this.$extends({
      query: {
        message: {
          async create({ args, query }) {
            if (args.data.content) {
              args.data.content = EncryptionUtil.encrypt(args.data.content, key);
            }
            return query(args);
          },
          async update({ args, query }) {
            if (typeof args.data.content === 'string') {
              args.data.content = EncryptionUtil.encrypt(args.data.content, key);
            }
            return query(args);
          },
        },
        memory: {
          async create({ args, query }) {
            if (args.data.content) {
              args.data.content = EncryptionUtil.encrypt(args.data.content, key);
            }
            return query(args);
          },
          async update({ args, query }) {
            if (typeof args.data.content === 'string') {
              args.data.content = EncryptionUtil.encrypt(args.data.content, key);
            }
            return query(args);
          },
        },
      },
      result: {
        message: {
          content: {
            compute(message) {
              return EncryptionUtil.decrypt(message.content, key);
            },
          },
        },
        memory: {
          content: {
            compute(memory) {
              return EncryptionUtil.decrypt(memory.content, key);
            },
          },
        },
      },
    });

    // Proxy the client properties (message, memory, user, etc.) to the extended client
    // This allows services to use this.prisma.message.create() and get the extension
    const models = ['user', 'memory', 'message', 'session', 'account', 'behavioralBaseline'];
    models.forEach((model) => {
      (this as any)[model] = (this._extendedClient as any)[model];
    });
  }

  /**
   * Access to the extended client with encryption/decryption logic
   */
  get client() {
    return this._extendedClient || this;
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

    const results = await this.$queryRaw<any[]>`
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

    // Manual decryption for raw queries
    return results.map((row) => ({
      ...row,
      content: EncryptionUtil.decrypt(row.content, this.encryptionKey),
    }));
  }
}
