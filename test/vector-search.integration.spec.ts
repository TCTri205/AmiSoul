import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../src/prisma/prisma.service';
import { ConfigModule } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

describe('PrismaService Vector Search (Integration)', () => {
  let prismaService: PrismaService;
  let userId: string;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot()],
      providers: [PrismaService],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    await prismaService.onModuleInit();

    // Create a test user
    userId = randomUUID();
    await prismaService.user.create({
      data: {
        id: userId,
        username: `testuser_${userId.substring(0, 8)}`,
      },
    });
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await prismaService.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await prismaService.onModuleDestroy();
  });

  it('should store and retrieve memories using vector search', async () => {
    // Seed memories
    const vector1 = new Array(768).fill(0);
    vector1[0] = 1; // [1, 0, 0, ...]
    
    const vector2 = new Array(768).fill(0);
    vector2[1] = 1; // [0, 1, 0, ...]

    const id1 = randomUUID();
    const id2 = randomUUID();

    await prismaService.$executeRawUnsafe(`
      INSERT INTO memories (id, user_id, content, embedding)
      VALUES 
        ('${id1}', '${userId}', 'Memory about Apples', '[${vector1.join(',')}]'::vector),
        ('${id2}', '${userId}', 'Memory about Bananas', '[${vector2.join(',')}]'::vector)
    `);

    // Search for something close to vector1
    const queryVector = new Array(768).fill(0);
    queryVector[0] = 0.9;
    queryVector[1] = 0.1;

    const results = await prismaService.searchSimilarMemories(userId, queryVector, 2);

    expect(results).toHaveLength(2);
    expect(results[0].content).toBe('Memory about Apples');
    expect(results[0].similarity).toBeGreaterThan(0.8);
    expect(results[1].content).toBe('Memory about Bananas');
  });
});
