import { Test, TestingModule } from '@nestjs/testing';
import { PerceptionMiddleware } from './perception.middleware';
import { AggregatedMessageBlockDto } from '../stages/stage0-aggregator/dto/aggregated-message-block.dto';
import { PerceptionResultDto } from '../stages/stage1-perception/dto/perception-result.dto';

describe('PerceptionMiddleware', () => {
  let middleware: PerceptionMiddleware;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PerceptionMiddleware],
    }).compile();

    middleware = module.get<PerceptionMiddleware>(PerceptionMiddleware);
  });

  it('should be defined', () => {
    expect(middleware).toBeDefined();
  });

  describe('extractJson', () => {
    it('should extract JSON from a clean string', () => {
      const raw = '{"intent":"greeting","sentiment":"positive","complexity":2,"urgency":1}';
      const result = (middleware as any).extractJson(raw);
      expect(result.intent).toBe('greeting');
      expect(result.complexity).toBe(2);
    });

    it('should extract JSON from a markdown wrapped string', () => {
      const raw = 'Here is the result: ```json\n{"intent":"question","sentiment":"neutral","complexity":5,"urgency":3}\n```';
      const result = (middleware as any).extractJson(raw);
      expect(result.intent).toBe('question');
      expect(result.complexity).toBe(5);
    });

    it('should extract JSON from a string with trailing text', () => {
      const raw = '{"intent":"venting","sentiment":"negative","complexity":8,"urgency":9} Hope this helps!';
      const result = (middleware as any).extractJson(raw);
      expect(result.intent).toBe('venting');
      expect(result.urgency).toBe(9);
    });

    it('should throw error if no JSON found', () => {
      const raw = 'This is just some plain text with no object.';
      expect(() => (middleware as any).extractJson(raw)).toThrow('No JSON object found in text');
    });
  });

  describe('normalizeSentiment', () => {
    it('should map positive to 1.0', () => {
      expect((middleware as any).normalizeSentiment('positive')).toBe(1.0);
    });

    it('should map negative to -1.0', () => {
      expect((middleware as any).normalizeSentiment('negative')).toBe(-1.0);
    });

    it('should map neutral to 0.0', () => {
      expect((middleware as any).normalizeSentiment('neutral')).toBe(0.0);
    });

    it('should map unknown to 0.0', () => {
      expect((middleware as any).normalizeSentiment('unknown')).toBe(0.0);
    });

    it('should be case-insensitive', () => {
      expect((middleware as any).normalizeSentiment('Positive')).toBe(1.0);
      expect((middleware as any).normalizeSentiment('NEGATIVE')).toBe(-1.0);
      expect((middleware as any).normalizeSentiment('  neutral  ')).toBe(0.0);
    });
  });


  describe('determineRouting', () => {
    it('should route to fast path for simple input', () => {
      const perception: Partial<PerceptionResultDto> = {
        complexity: 3,
        routing_confidence: 0.9,
        urgency: 2,
      };
      expect((middleware as any).determineRouting(perception)).toBe('fast');
    });

    it('should route to full path if complexity > 7', () => {
      const perception: Partial<PerceptionResultDto> = {
        complexity: 8,
        routing_confidence: 0.9,
        urgency: 2,
      };
      expect((middleware as any).determineRouting(perception)).toBe('full');
    });

    it('should route to full path if routing_confidence < 0.85', () => {
      const perception: Partial<PerceptionResultDto> = {
        complexity: 3,
        routing_confidence: 0.8,
        urgency: 2,
      };
      expect((middleware as any).determineRouting(perception)).toBe('full');
    });

    it('should route to full path if urgency > 8', () => {
      const perception: Partial<PerceptionResultDto> = {
        complexity: 3,
        routing_confidence: 0.9,
        urgency: 9,
      };
      expect((middleware as any).determineRouting(perception)).toBe('full');
    });

    it('should route to full path if timestamp_flag is a string (Time Anomaly)', () => {
      const perception: Partial<PerceptionResultDto> = {
        complexity: 3,
        routing_confidence: 0.95,
        urgency: 1,
        timestamp_flag: 'Late_Night',
      };
      expect((middleware as any).determineRouting(perception)).toBe('full');
    });
  });

  describe('transform', () => {
    const mockPayload: AggregatedMessageBlockDto = {
      userId: 'user123',
      sessionId: 'session456',
      fullContent: 'Hello world',
      messages: [],
    } as any;

    it('should transform raw output into CognitiveContext', () => {
      const raw = '{"intent":"greeting","sentiment":"positive","complexity":2,"urgency":1,"routing_confidence":0.95}';
      const context = middleware.transform(raw, mockPayload);

      expect(context.userId).toBe('user123');
      expect(context.routingPath).toBe('fast');
      expect(context.normalizedSentiment).toBe(1.0);
      expect(context.perception.intent).toBe('greeting');
    });

    it('should use fallback if parsing fails', () => {
      const raw = 'invalid json';
      const context = middleware.transform(raw, mockPayload);

      expect(context.perception.intent).toBe('unknown');
      expect(context.routingPath).toBe('full'); // routing_confidence is 0 in fallback, triggering full path
    });


    it('should merge existing perception and prioritize heuristic safety flags', () => {
      const raw = '{"intent":"sharing","is_crisis":false}';
      const existing: PerceptionResultDto = {
        intent: 'sharing',
        sentiment: 'neutral',
        complexity: 10,
        urgency: 5,
        identity_anomaly: false,
        routing_confidence: 0.9,
        sarcasm_hint: false,
        timestamp_flag: false,
        noise_flag: false,
        is_crisis: true, // Heuristic says true
        is_injection: false,
      };
      
      const context = middleware.transform(raw, mockPayload, existing as any);

      expect(context.perception.intent).toBe('sharing');
      expect(context.perception.complexity).toBe(10);
      expect(context.perception.is_crisis).toBe(true); // Should remain true despite JSON saying false
      expect(context.perception.urgency).toBe(10); // Should be boosted to 10
      expect(context.routingPath).toBe('full');
    });

  });
});
