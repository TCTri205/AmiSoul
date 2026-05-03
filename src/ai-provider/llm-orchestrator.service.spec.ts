import { Test, TestingModule } from '@nestjs/testing';
import { LlmOrchestrator } from './llm-orchestrator.service';
import { GroqProvider } from './providers/groq.provider';
import { GeminiProvider } from './providers/gemini.provider';
import { LlmRequest, LlmResponse } from './interfaces/llm-provider.interface';
import { RedisService } from '../redis/redis.service';

describe('LlmOrchestrator', () => {
  let service: LlmOrchestrator;
  let groqProvider: jest.Mocked<GroqProvider>;
  let geminiProvider: jest.Mocked<GeminiProvider>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const groqMock = {
      generate: jest.fn(),
      name: 'groq',
    };
    const geminiMock = {
      generate: jest.fn(),
      embed: jest.fn(),
      name: 'gemini',
    };
    const redisMock = {
      get: jest.fn(),
      set: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LlmOrchestrator,
        { provide: GroqProvider, useValue: groqMock },
        { provide: GeminiProvider, useValue: geminiMock },
        { provide: RedisService, useValue: redisMock },
      ],
    }).compile();

    service = module.get<LlmOrchestrator>(LlmOrchestrator);
    groqProvider = module.get(GroqProvider);
    geminiProvider = module.get(GeminiProvider);
    redisService = module.get(RedisService);

    // Manually call onModuleInit as Nest doesn't do it automatically in tests unless using app.init()
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should use Groq as primary and succeed', async () => {
    const mockResponse: LlmResponse = {
      text: 'Hello from Groq',
      provider: 'groq',
      model: 'llama-3',
    };
    groqProvider.generate.mockResolvedValue(mockResponse);

    const result = await service.generate({ userPrompt: 'hi' });

    expect(result.text).toBe('Hello from Groq');
    expect(groqProvider.generate).toHaveBeenCalled();
    expect(geminiProvider.generate).not.toHaveBeenCalled();
  });

  it('should failover to Gemini if Groq fails', async () => {
    groqProvider.generate.mockRejectedValue(new Error('Groq Down'));
    const mockResponse: LlmResponse = {
      text: 'Hello from Gemini',
      provider: 'gemini',
      model: 'gemini',
    };
    geminiProvider.generate.mockResolvedValue(mockResponse);

    const result = await service.generate({ userPrompt: 'hi' });

    expect(result.text).toBe('Hello from Gemini');
    expect(groqProvider.generate).toHaveBeenCalled();
    expect(geminiProvider.generate).toHaveBeenCalled();
  });

  it('should throw error if all providers fail', async () => {
    groqProvider.generate.mockRejectedValue(new Error('Groq Down'));
    geminiProvider.generate.mockRejectedValue(new Error('Gemini Down'));

    await expect(service.generate({ userPrompt: 'hi' })).rejects.toThrow('Gemini Down');
  });

  it('should respect AbortSignal', async () => {
    const controller = new AbortController();
    controller.abort();

    groqProvider.generate.mockImplementation(async (req) => {
      if (req.signal?.aborted) throw new Error('AbortError');
      return { text: 'too late', provider: 'groq', model: 'm' };
    });

    await expect(service.generate({ userPrompt: 'hi', signal: controller.signal })).rejects.toThrow(
      'AbortError',
    );
  });

  describe('embed', () => {
    it('should return cached embedding if available', async () => {
      redisService.get.mockResolvedValue(JSON.stringify([1, 2, 3]));

      const result = await service.embed('test text');

      expect(result).toEqual([1, 2, 3]);
      expect(redisService.get).toHaveBeenCalled();
      expect(geminiProvider.embed).not.toHaveBeenCalled();
    });

    it('should call provider and cache result if not in cache', async () => {
      redisService.get.mockResolvedValue(null);
      geminiProvider.embed.mockResolvedValue([4, 5, 6]);

      const result = await service.embed('new text');

      expect(result).toEqual([4, 5, 6]);
      expect(geminiProvider.embed).toHaveBeenCalledWith('new text');
      expect(redisService.set).toHaveBeenCalled();
    });
  });
});
