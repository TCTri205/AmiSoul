import { Test, TestingModule } from '@nestjs/testing';
import { TokenBudgetManager, ContextData } from './token-budget-manager.service';

describe('TokenBudgetManager', () => {
  let service: TokenBudgetManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TokenBudgetManager],
    }).compile();

    service = module.get<TokenBudgetManager>(TokenBudgetManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not prune if under budget', () => {
    const data: ContextData = {
      userInput: 'Hello',
      persona: 'You are Ami',
      vibe: 'Friendly',
      memories: ['Memory 1'],
      history: [{ role: 'user', content: 'Hi' }],
    };

    const pruned = service.prune(data);
    expect(pruned).toEqual(data);
    expect(pruned.memories).toHaveLength(1);
    expect(pruned.history).toHaveLength(1);
  });

  it('should prune memories first when over budget', () => {
    // MAX_TOTAL_TOKENS = 3000, CHARS_PER_TOKEN = 4 -> ~12000 chars
    const largeMemory = 'M'.repeat(10000);
    const data: ContextData = {
      userInput: 'Hello',
      persona: 'Ami',
      vibe: 'Vibe',
      memories: [largeMemory, largeMemory],
      history: [],
    };

    const pruned = service.prune(data);
    expect(pruned.memories!.length).toBeLessThan(2);
  });

  it('should prune history (oldest first) if memories are gone and still over budget', () => {
    const veryLargeHistory = 'H'.repeat(10000); // 10000 chars = 2500 tokens
    const data: ContextData = {
      userInput: 'Hello',
      persona: 'Ami',
      vibe: 'Vibe',
      memories: [],
      history: [
        { role: 'user', content: 'Oldest: ' + veryLargeHistory }, // Total ~5000 tokens
        { role: 'user', content: 'Newest: ' + veryLargeHistory },
      ],
    };

    const pruned = service.prune(data);
    expect(pruned.history!.length).toBe(1);
    expect(pruned.history![0].content).toContain('Newest');
  });

  it('should truncate vibe as a last resort', () => {
    const veryLargeVibe = 'V'.repeat(20000); // 5000 tokens
    const data: ContextData = {
      userInput: 'Short',
      persona: 'Short',
      vibe: veryLargeVibe,
      memories: [],
      history: [],
    };

    const pruned = service.prune(data);
    expect(pruned.vibe!.length).toBeLessThan(veryLargeVibe.length);
  });

  it('should NOT corrupt XML tags when pruning vibe (CRITICAL FIX TEST)', () => {
    // Total vibe length will be 16000. Truncation point will be 8000.
    // We want the character at index 8000 to be '<' to see if it gets left hanging.
    const padding = 'A'.repeat(8000); 
    const brokenTag = '<corrupt>me</corrupt>';
    const xmlVibe = padding + brokenTag; // 8021 chars
    
    const data: ContextData = {
      userInput: 'S',
      persona: 'S',
      vibe: xmlVibe,
      memories: [],
      history: [],
    };

    // To force pruning, we need to exceed 12000 chars.
    // 8021 + 2 (S,S) is not enough.
    data.vibe += 'B'.repeat(10000); // Total 18021
    
    // Naive truncation at 18021 / 2 = 9010.
    // padding(8000) + brokenTag(21) = 8021.
    // Index 9010 is well into the 'B's.
    
    // Let's make it exactly hit the tag.
    // We want vibe.length / 2 = 8001.
    // So vibe.length = 16002.
    // padding = 8000. Index 8000 is '<'.
    const exactPadding = 'A'.repeat(8000);
    const exactVibe = exactPadding + '<tag>content</tag>'; // 8018 chars
    
    const exactData: ContextData = {
      userInput: '',
      persona: '',
      vibe: exactPadding + '<tag>content</tag>' + 'B'.repeat(7984), // 8000 + 18 + 7984 = 16002
      memories: [],
      history: [],
    };
    
    // Truncation at 16002 / 2 = 8001.
    // result = exactVibe.substring(0, 8001) = exactPadding + '<'
    
    const pruned = service.prune(exactData);
    expect(pruned.vibe).not.toMatch(/<[^>]*$/); // Should not end with an open bracket
  });

  it('should handle nested tags correctly during safeXmlTruncate', () => {
    // We can access private method for extreme edge case testing
    const nested = '<outer><inner>some content</inner></outer>';
    // Cut exactly at '<inner>'
    const truncated = (service as any).safeXmlTruncate(nested, 8); 
    // substring(0, 8) = '<outer><'
    // lastOpen = 7, lastClose = 6
    // result = substring(0, 7) = '<outer>'
    expect(truncated).toBe('<outer>');
  });
});
