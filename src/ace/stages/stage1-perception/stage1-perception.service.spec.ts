import { Test, TestingModule } from '@nestjs/testing';
import { Stage1PerceptionService } from './stage1-perception.service';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';
import { SessionType } from '../../../chat/dto/message.dto';

describe('Stage1PerceptionService', () => {
  let service: Stage1PerceptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Stage1PerceptionService],
    }).compile();

    service = module.get<Stage1PerceptionService>(Stage1PerceptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should process perception and return intent', async () => {
    const payload: AggregatedMessageBlockDto = {
      userId: 'user1',
      messages: [{ content: 'hello', timestamp: '' }],
      sessionType: SessionType.PERSISTENT,
      fullContent: 'hello',
      requiresSummarization: false,
      aggregatedAt: '',
    };

    // Use a short timeout for simulation in tests if possible, 
    // but the service has 2000ms hardcoded. We might need to mock simulateWork or wait.
    // Let's use jest.spyOn to speed up the test.
    jest.spyOn(service as any, 'simulateWork').mockResolvedValue(undefined);

    const result = await service.process(payload);

    expect(result).toEqual({
      intent: 'general_chat',
      sentiment: 'neutral',
      urgency: 1,
    });
  });

  describe('simulateWork and AbortSignal', () => {
    it('should resolve if not aborted', async () => {
      // Use fake timers to advance the 2000ms wait
      jest.useFakeTimers();
      const promise = (service as any).simulateWork(100);
      jest.advanceTimersByTime(100);
      await expect(promise).resolves.toBeUndefined();
      jest.useRealTimers();
    });

    it('should reject if signal is already aborted', async () => {
      const controller = new AbortController();
      controller.abort();
      
      await expect((service as any).simulateWork(100, controller.signal))
        .rejects.toThrow('AbortError');
    });

    it('should reject when signal is aborted during work', async () => {
      jest.useFakeTimers();
      const controller = new AbortController();
      
      const promise = (service as any).simulateWork(1000, controller.signal);
      
      jest.advanceTimersByTime(500);
      controller.abort();
      
      await expect(promise).rejects.toThrow('AbortError');
      jest.useRealTimers();
    });

    it('should remove event listener after resolution', async () => {
      const controller = new AbortController();
      const removeSpy = jest.spyOn(controller.signal, 'removeEventListener');
      
      jest.useFakeTimers();
      const promise = (service as any).simulateWork(100, controller.signal);
      jest.advanceTimersByTime(100);
      await promise;
      
      expect(removeSpy).toHaveBeenCalledWith('abort', expect.any(Function));
      jest.useRealTimers();
    });
  });
});
