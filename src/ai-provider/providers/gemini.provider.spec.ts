import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GeminiProvider } from './gemini.provider';

jest.mock('@google/generative-ai');

describe('GeminiProvider', () => {
  let provider: GeminiProvider;

  beforeEach(async () => {
    const configMock = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [GeminiProvider, { provide: ConfigService, useValue: configMock }],
    }).compile();

    provider = module.get<GeminiProvider>(GeminiProvider);
  });

  it('should rotate keys on 429 error', async () => {
    (provider as any).apiKeys = ['key1', 'key2'];
    (provider as any).currentKeyIndex = 0;

    const mockGenerateContent = jest.fn();
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    }));

    mockGenerateContent.mockRejectedValueOnce({ status: 429, message: 'Too Many Requests' });
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => 'success',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1, totalTokenCount: 2 },
      },
    });

    const result = await provider.generate({ userPrompt: 'test' });

    expect(result.text).toBe('success');
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
    expect((provider as any).currentKeyIndex).toBe(1);
  });
});
