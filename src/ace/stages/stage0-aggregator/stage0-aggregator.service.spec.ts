import { Test, TestingModule } from '@nestjs/testing';
import { Stage0AggregatorService } from './stage0-aggregator.service';
import { RedisService } from '../../../redis/redis.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SessionType } from '../../../chat/dto/message.dto';

describe('Stage0AggregatorService', () => {
  let service: Stage0AggregatorService;
  let redisService: RedisService;
  let eventEmitter: EventEmitter2;

  const mockRedisService = {
    rpush: jest.fn(),
    exists: jest.fn(),
    set: jest.fn(),
    expire: jest.fn(),
    lrange: jest.fn(),
    del: jest.fn(),
    get: jest.fn(),
  };

  const mockEventEmitter = {
    emit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        Stage0AggregatorService,
        { provide: RedisService, useValue: mockRedisService },
        { provide: EventEmitter2, useValue: mockEventEmitter },
      ],
    }).compile();

    service = module.get<Stage0AggregatorService>(Stage0AggregatorService);
    redisService = module.get<RedisService>(RedisService);
    eventEmitter = module.get<EventEmitter2>(EventEmitter2);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
    // Clear any pending timers
    (service as any).debounceTimers.forEach(clearTimeout);
    (service as any).hardCapTimers.forEach(clearTimeout);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should start a new block when no debounce exists', async () => {
    mockRedisService.exists.mockResolvedValue(false);
    mockRedisService.rpush.mockResolvedValue(1);
    
    await service.aggregateMessage('user1', 'session1', { content: 'hello' }, SessionType.PERSISTENT);

    expect(mockRedisService.rpush).toHaveBeenCalledWith('buffer:user1', expect.stringContaining('hello'));
    expect(mockRedisService.set).toHaveBeenCalledWith('debounce:user1', 'active', 2500);
    expect(mockRedisService.expire).toHaveBeenCalledWith('buffer:user1', 10000);
  });

  it('should reset debounce when it already exists', async () => {
    mockRedisService.exists.mockResolvedValue(true);
    
    await service.aggregateMessage('user1', 'session1', { content: 'world' }, SessionType.PERSISTENT);

    expect(mockRedisService.expire).toHaveBeenCalledWith('debounce:user1', 2500);
  });

  it('should flush buffer and emit event', async () => {
    mockRedisService.lrange.mockResolvedValue([
      JSON.stringify({ content: 'hello', timestamp: new Date().toISOString() }),
      JSON.stringify({ content: 'world', timestamp: new Date().toISOString() }),
    ]);

    await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);

    expect(mockRedisService.lrange).toHaveBeenCalledWith('buffer:user1', 0, -1);
    expect(mockRedisService.del).toHaveBeenCalledWith('buffer:user1');
    expect(mockRedisService.del).toHaveBeenCalledWith('debounce:user1');
    expect(eventEmitter.emit).toHaveBeenCalledWith('stage0.aggregated', expect.objectContaining({
      userId: 'user1',
      messages: expect.arrayContaining([
        expect.objectContaining({ content: 'hello' }),
        expect.objectContaining({ content: 'world' }),
      ]),
      fullContent: 'hello\nworld',
      sessionType: SessionType.PERSISTENT,
      requiresSummarization: false,
    }));
  });

  it('should respect Incognito session type', async () => {
    mockRedisService.lrange.mockResolvedValue([
      JSON.stringify({ content: 'secret', timestamp: '' }),
    ]);

    await service.flushBuffer('user1', 'session1', SessionType.INCOGNITO);

    expect(eventEmitter.emit).toHaveBeenCalledWith('stage0.aggregated', expect.objectContaining({
      sessionType: SessionType.INCOGNITO,
    }));
  });

  it('should flush immediately if 10 messages reached', async () => {
    mockRedisService.exists.mockResolvedValue(true);
    mockRedisService.rpush.mockResolvedValue(10); // 10th message
    mockRedisService.lrange.mockResolvedValue(new Array(10).fill(JSON.stringify({ content: 'test', timestamp: '' })));
    
    const flushSpy = jest.spyOn(service, 'flushBuffer');
    
    await service.aggregateMessage('user1', 'session1', { content: 'msg 10' }, SessionType.PERSISTENT);
    
    expect(flushSpy).toHaveBeenCalledWith('user1', 'session1', SessionType.PERSISTENT);
  });

  it('should flag requiresSummarization if content is too long', async () => {
    const longContent = 'a'.repeat(3201); // > 800 tokens (4 chars/token)
    mockRedisService.lrange.mockResolvedValue([
      JSON.stringify({ content: longContent, timestamp: new Date().toISOString() }),
    ]);

    await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);

    expect(eventEmitter.emit).toHaveBeenCalledWith('stage0.aggregated', expect.objectContaining({
      requiresSummarization: true,
    }));
  });

  it('should flush after 4s hard cap even if messages keep arriving', async () => {
    jest.useFakeTimers();
    mockRedisService.exists.mockResolvedValueOnce(false); // First message
    mockRedisService.exists.mockResolvedValue(true); // Subsequent messages
    mockRedisService.rpush.mockResolvedValue(1);
    mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);

    const flushSpy = jest.spyOn(service, 'flushBuffer');

    // 1. First message starts the hard cap
    await service.aggregateMessage('user1', 'session1', { content: 'msg 1' }, SessionType.PERSISTENT);
    expect(flushSpy).not.toHaveBeenCalled();

    // 2. Advance 2 seconds, send another message (resets debounce but NOT hard cap)
    jest.advanceTimersByTime(2000);
    await service.aggregateMessage('user1', 'session1', { content: 'msg 2' }, SessionType.PERSISTENT);
    expect(flushSpy).not.toHaveBeenCalled();

    // 3. Advance another 2.1 seconds (total 4.1s)
    jest.advanceTimersByTime(2100);
    expect(flushSpy).toHaveBeenCalledWith('user1', 'session1', SessionType.PERSISTENT);
  });

  it('should clear existing hard cap timer if redis debounce expired but local timer is active', async () => {
    mockRedisService.exists.mockResolvedValue(false);
    mockRedisService.rpush.mockResolvedValue(1);

    // 1. Send first message (starts hard cap)
    await service.aggregateMessage('user1', 'session1', { content: 'm1' }, SessionType.PERSISTENT);
    expect((service as any).hardCapTimers.has('user1')).toBe(true);

    // 2. Simulate Redis debounce key expiring (exists = false)
    // but we send another message. This should clear and restart the hard cap.
    mockRedisService.exists.mockResolvedValue(false);
    await service.aggregateMessage('user1', 'session1', { content: 'm2' }, SessionType.PERSISTENT);
    
    expect(mockRedisService.set).toHaveBeenCalledTimes(2); // Debounce set twice
  });

  it('should do nothing if flushBuffer is called with empty buffer', async () => {
    mockRedisService.lrange.mockResolvedValue([]);
    await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);
    expect(eventEmitter.emit).not.toHaveBeenCalled();
  });

  describe('Preemption', () => {
    it('should create AbortSignal when flushing', async () => {
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      
      await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);
      
      expect(eventEmitter.emit).toHaveBeenCalledWith('stage0.aggregated', expect.objectContaining({
        signal: expect.any(Object),
      }));
    });

    it('should abort previous pipeline if new message arrives within limit', async () => {
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);
      
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;

      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockResolvedValue('normal');
      
      await service.aggregateMessage('user1', 'session1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      expect(signal.aborted).toBe(true);
    });

    it('should NOT abort if limiter is active and vibe is normal', async () => {
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);
      
      (service as any).preemptCounts.set('user1', 2);
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;

      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockResolvedValue('normal');
      
      await service.aggregateMessage('user1', 'session1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      expect(signal.aborted).toBe(false);
    });

    it('should bypass limiter if vibe is extreme', async () => {
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);
      
      (service as any).preemptCounts.set('user1', 2);
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;

      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockResolvedValue('extreme');
      
      await service.aggregateMessage('user1', 'session1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      expect(signal.aborted).toBe(true);
    });

    it('should handle redis failure during preemption check', async () => {
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);
      
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;

      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockRejectedValue(new Error('Redis down'));
      
      await service.aggregateMessage('user1', 'session1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      // Should still abort if count < 2
      expect(signal.aborted).toBe(true);
    });

    it('should NOT abort during redis failure if limiter is reached', async () => {
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', 'session1', SessionType.PERSISTENT);
      
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;
      (service as any).preemptCounts.set('user1', 2);

      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockRejectedValue(new Error('Redis down'));
      
      await service.aggregateMessage('user1', 'session1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      expect(signal.aborted).toBe(false);
    });

    it('should reset limiter on pipeline completion (success)', () => {
      (service as any).preemptCounts.set('user1', 2);
      service.handlePipelineCompleted({ userId: 'user1', status: 'success' });
      expect((service as any).preemptCounts.get('user1')).toBe(0);
    });

    it('should NOT reset limiter on pipeline completion (aborted)', () => {
      (service as any).preemptCounts.set('user1', 2);
      service.handlePipelineCompleted({ userId: 'user1', status: 'aborted' });
      expect((service as any).preemptCounts.get('user1')).toBe(2);
    });
  });
});
