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
    
    await service.aggregateMessage('user1', { content: 'hello' }, SessionType.PERSISTENT);

    expect(mockRedisService.rpush).toHaveBeenCalledWith('buffer:user1', expect.stringContaining('hello'));
    expect(mockRedisService.set).toHaveBeenCalledWith('debounce:user1', 'active', 1500);
    expect(mockRedisService.expire).toHaveBeenCalledWith('buffer:user1', 10000);
  });

  it('should reset debounce when it already exists', async () => {
    mockRedisService.exists.mockResolvedValue(true);
    
    await service.aggregateMessage('user1', { content: 'world' }, SessionType.PERSISTENT);

    expect(mockRedisService.expire).toHaveBeenCalledWith('debounce:user1', 1500);
  });

  it('should flush buffer and emit event', async () => {
    mockRedisService.lrange.mockResolvedValue([
      JSON.stringify({ content: 'hello', timestamp: new Date().toISOString() }),
      JSON.stringify({ content: 'world', timestamp: new Date().toISOString() }),
    ]);

    await service.flushBuffer('user1', SessionType.PERSISTENT);

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
      requiresSummarization: false,
    }));
  });

  it('should flush immediately if 10 messages reached', async () => {
    mockRedisService.exists.mockResolvedValue(true);
    mockRedisService.rpush.mockResolvedValue(10); // 10th message
    mockRedisService.lrange.mockResolvedValue(new Array(10).fill(JSON.stringify({ content: 'test', timestamp: '' })));
    
    const flushSpy = jest.spyOn(service, 'flushBuffer');
    
    await service.aggregateMessage('user1', { content: 'msg 10' }, SessionType.PERSISTENT);
    
    expect(flushSpy).toHaveBeenCalledWith('user1', SessionType.PERSISTENT);
  });

  it('should flag requiresSummarization if content is too long', async () => {
    const longContent = 'a'.repeat(3201); // > 800 tokens (4 chars/token)
    mockRedisService.lrange.mockResolvedValue([
      JSON.stringify({ content: longContent, timestamp: new Date().toISOString() }),
    ]);

    await service.flushBuffer('user1', SessionType.PERSISTENT);

    expect(eventEmitter.emit).toHaveBeenCalledWith('stage0.aggregated', expect.objectContaining({
      requiresSummarization: true,
    }));
  });

  describe('Preemption', () => {
    it('should create AbortSignal when flushing', async () => {
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      
      await service.flushBuffer('user1', SessionType.PERSISTENT);
      
      expect(eventEmitter.emit).toHaveBeenCalledWith('stage0.aggregated', expect.objectContaining({
        signal: expect.any(Object),
      }));
    });

    it('should abort previous pipeline if new message arrives within limit', async () => {
      // 1. Flush to start a pipeline
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', SessionType.PERSISTENT);
      
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;
      const abortSpy = jest.spyOn(signal, 'aborted', 'get');

      // 2. New message arrives
      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockResolvedValue('normal'); // Normal vibe
      
      await service.aggregateMessage('user1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      expect(signal.aborted).toBe(true);
    });

    it('should NOT abort if limiter is active and vibe is normal', async () => {
      // 1. Flush to start a pipeline
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', SessionType.PERSISTENT);
      
      // Manually set preemptCount to 2
      (service as any).preemptCounts.set('user1', 2);
      
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;

      // 2. New message arrives
      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockResolvedValue('normal');
      
      await service.aggregateMessage('user1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      expect(signal.aborted).toBe(false);
    });

    it('should bypass limiter if vibe is extreme', async () => {
      // 1. Flush to start a pipeline
      mockRedisService.lrange.mockResolvedValue([JSON.stringify({ content: 'hi', timestamp: '' })]);
      await service.flushBuffer('user1', SessionType.PERSISTENT);
      
      // Manually set preemptCount to 2
      (service as any).preemptCounts.set('user1', 2);
      
      const signal = (eventEmitter.emit as jest.Mock).mock.calls[0][1].signal;

      // 2. New message arrives with extreme vibe
      mockRedisService.exists.mockResolvedValue(false);
      mockRedisService.get.mockResolvedValue('extreme');
      
      await service.aggregateMessage('user1', { content: 'new msg' }, SessionType.PERSISTENT);
      
      expect(signal.aborted).toBe(true);
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
