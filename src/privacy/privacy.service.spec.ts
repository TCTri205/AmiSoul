import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PrivacyService } from './privacy.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('PrivacyService', () => {
  let service: PrivacyService;
  let prisma: PrismaService;
  let redis: RedisService;
  let config: ConfigService;

  const mockPrisma = {
    $transaction: jest.fn((actions) => Promise.all(actions)),
    memory: {
      updateMany: jest.fn().mockResolvedValue({ count: 5 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 5 }),
      findMany: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ id: 'mem1' }),
    },
    session: {
      updateMany: jest.fn().mockResolvedValue({ count: 2 }),
      deleteMany: jest.fn().mockResolvedValue({ count: 2 }),
      findMany: jest.fn().mockResolvedValue([]),
    },
    behavioralBaseline: {
      deleteMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: {
      findUnique: jest.fn().mockResolvedValue({ id: 'user1' }),
      update: jest.fn().mockResolvedValue({ id: 'user1' }),
    },
  };

  const mockRedis = {
    del: jest.fn().mockResolvedValue(1),
  };

  const mockConfig = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrivacyService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<PrivacyService>(PrivacyService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    config = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('softDeleteUserData', () => {
    it('should soft delete data when enabled', async () => {
      mockConfig.get.mockReturnValue(true);
      await service.softDeleteUserData('user1');

      expect(prisma.memory.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user1', isDeleted: false },
        data: { isDeleted: true },
      });
      expect(prisma.session.updateMany).toHaveBeenCalled();
      expect(redis.del).toHaveBeenCalled();
    });

    it('should fall back to hard delete when soft delete is disabled', async () => {
      mockConfig.get.mockReturnValue(false);
      const hardDeleteSpy = jest.spyOn(service, 'hardDeleteUserData').mockResolvedValue();

      await service.softDeleteUserData('user1');

      expect(hardDeleteSpy).toHaveBeenCalledWith('user1');
      expect(prisma.memory.updateMany).not.toHaveBeenCalled();
    });

    it('should handle string "false" from config', async () => {
      mockConfig.get.mockReturnValue('false');
      const hardDeleteSpy = jest.spyOn(service, 'hardDeleteUserData').mockResolvedValue();

      await service.softDeleteUserData('user1');

      expect(hardDeleteSpy).toHaveBeenCalledWith('user1');
    });
  });

  describe('hardDeleteUserData', () => {
    it('should permanently delete data', async () => {
      await service.hardDeleteUserData('user1');

      expect(prisma.memory.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
      expect(prisma.session.deleteMany).toHaveBeenCalled();
      expect(prisma.behavioralBaseline.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'user1' },
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user1' },
        data: { bondingScore: 0, dpe: null },
      });
      expect(redis.del).toHaveBeenCalled();
    });
  });

  describe('clearRedisCache', () => {
    it('should clear all specific keys', async () => {
      // Accessing private method for testing
      await (service as any).clearRedisCache('user1');

      const expectedKeys = [
        'cal:expectations:user1',
        'cal:pending:user1',
        'cal:dates:user1',
        'chat_history:user1',
        'vibe:user1',
        'user:behavioral_signature:user1',
        'buffer:user1',
        'debounce:user1',
      ];

      expectedKeys.forEach(key => {
        expect(redis.del).toHaveBeenCalledWith(key);
      });
    });
  });

  describe('deleteMemory', () => {
    it('should delete a single memory and clear cache', async () => {
      await service.deleteMemory('user1', 'mem1');

      expect(prisma.memory.delete).toHaveBeenCalledWith({
        where: { id: 'mem1', userId: 'user1' },
      });
      expect(redis.del).toHaveBeenCalled();
    });
  });
});
