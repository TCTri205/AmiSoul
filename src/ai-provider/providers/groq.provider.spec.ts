import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GroqProvider } from './groq.provider';
import Groq from 'groq-sdk';

jest.mock('groq-sdk');

describe('GroqProvider', () => {
  let provider: GroqProvider;

  beforeEach(async () => {
    const configMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GroqProvider,
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    provider = module.get<GroqProvider>(GroqProvider);
  });

  it('should rotate keys on 429 error', async () => {
    (provider as any).apiKeys = ['key1', 'key2'];
    (provider as any).currentKeyIndex = 0;

    const mockCreate = jest.fn();
    (Groq as unknown as jest.Mock).mockImplementation(() => ({
      chat: {
        completions: {
          create: mockCreate,
        },
      },
    }));

    mockCreate.mockRejectedValueOnce({ status: 429, message: 'Rate limit' });
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'success' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    });

    const result = await provider.generate({ userPrompt: 'test' });

    expect(result.text).toBe('success');
    expect(mockCreate).toHaveBeenCalledTimes(2);
    expect((provider as any).currentKeyIndex).toBe(1); 
  });
});
