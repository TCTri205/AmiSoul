import { Test, TestingModule } from '@nestjs/testing';
import { IdentityService } from './identity.service';
import { RedisService } from '../../../redis/redis.service';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';
import { SessionType } from '../../../chat/dto/message.dto';

describe('IdentityService', () => {
  let service: IdentityService;
  let redisService: RedisService;

  const mockRedisService = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [IdentityService, { provide: RedisService, useValue: mockRedisService }],
    }).compile();

    service = module.get<IdentityService>(IdentityService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should bypass check if bonding score is low (< 10)', async () => {
    const result = await service.calculateAnomaly('user1', {} as any, 5);
    expect(result.isBypassed).toBe(true);
    expect(result.reason).toContain('Cold Start: Bonding score too low');
    expect(result.anomalyScore).toBe(0);
  });

  it('should bypass check if no baseline exists in Redis', async () => {
    mockRedisService.get.mockResolvedValue(null);
    const result = await service.calculateAnomaly('user1', {} as any, 20);
    expect(result.isBypassed).toBe(true);
    expect(result.reason).toContain('Cold Start: No behavioral signature');
  });

  it('should calculate high anomaly score if typing speed is significantly different', async () => {
    const baseline = {
      avgTypingSpeed: 10, // 10 chars/sec
      avgSentenceLength: 10, // 10 words/sentence
      topWords: { hello: 10, ami: 10 },
      sampleSize: 10,
      lastUpdated: new Date().toISOString(),
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(baseline));

    const payload: AggregatedMessageBlockDto = {
      userId: 'user1',
      sessionId: 'session1',
      messages: [
        { content: 'Hello', timestamp: new Date(2000, 1, 1, 10, 0, 0).toISOString() },
        {
          content: 'Very fast message block',
          timestamp: new Date(2000, 1, 1, 10, 0, 1).toISOString(),
        },
      ],
      fullContent: 'Hello. Very fast message block.',
      sessionType: SessionType.PERSISTENT,
      requiresSummarization: false,
      aggregatedAt: new Date().toISOString(),
    };

    const result = await service.calculateAnomaly('user1', payload, 20);
    expect(result.isBypassed).toBe(false);
    expect(result.anomalyScore).toBeGreaterThan(0.5); // Speed deviation will be 1.0, length/vocab will contribute too
  });

  it('should calculate low anomaly score if behavior matches baseline', async () => {
    const baseline = {
      avgTypingSpeed: 10,
      avgSentenceLength: 5,
      topWords: { word: 10, another: 10, here: 10 },
      sampleSize: 10,
      lastUpdated: new Date().toISOString(),
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(baseline));

    const payload: AggregatedMessageBlockDto = {
      userId: 'user1',
      sessionId: 'session1',
      messages: [
        { content: 'Word', timestamp: new Date(2000, 1, 1, 10, 0, 0).toISOString() },
        { content: 'Another word here', timestamp: new Date(2000, 1, 1, 10, 0, 2).toISOString() },
      ],
      fullContent: 'Word. Another word here.',
      sessionType: SessionType.PERSISTENT,
      requiresSummarization: false,
      aggregatedAt: new Date().toISOString(),
    };

    const result = await service.calculateAnomaly('user1', payload, 20);
    expect(result.anomalyScore).toBeLessThan(0.7);
  });

  it('should update signature with moving average and top words', async () => {
    const baseline = {
      avgTypingSpeed: 10,
      avgSentenceLength: 10,
      topWords: { existing: 1 },
      sampleSize: 1,
      lastUpdated: new Date().toISOString(),
    };
    mockRedisService.get.mockResolvedValue(JSON.stringify(baseline));

    const payload: AggregatedMessageBlockDto = {
      userId: 'user1',
      sessionId: 'session1',
      messages: [
        { content: 'A message', timestamp: new Date(2000, 1, 1, 10, 0, 0).toISOString() },
        { content: 'B message', timestamp: new Date(2000, 1, 1, 10, 0, 2).toISOString() },
      ],
      fullContent: 'A message. B message.', // Chars 21, words 4, sentences 2
      sessionType: SessionType.PERSISTENT,
      requiresSummarization: false,
      aggregatedAt: new Date().toISOString(),
    };

    await service.updateSignature('user1', payload);

    expect(mockRedisService.set).toHaveBeenCalledWith(
      expect.stringContaining('user1'),
      expect.stringContaining('"message":2'), // 'message' word count increased
    );
  });
});
