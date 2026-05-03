import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Stage1PerceptionService } from './stage1-perception.service';
import { CrisisService } from './crisis.service';
import { InjectionDetectionService } from './injection-detection.service';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';
import { SessionType } from '../../../chat/dto/message.dto';
import { AiProviderModule } from '../../../ai-provider/ai-provider.module';
import * as fs from 'fs';
import * as path from 'path';

describe('Stage1PerceptionService (Integration)', () => {
  let service: Stage1PerceptionService;
  const datasetPath = path.join(__dirname, '../../../../test/datasets/perception-eval.json');
  
  // Load dataset
  const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));

  // Set timeout to 20 minutes for full evaluation on free tier
  jest.setTimeout(1200000);

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env',
        }),
        AiProviderModule,
      ],
      providers: [
        Stage1PerceptionService,
        CrisisService,
        InjectionDetectionService,
      ],
    }).compile();

    service = module.get<Stage1PerceptionService>(Stage1PerceptionService);
    // Trigger module init to setup circuit breakers
    await module.init();
  });

  it('should evaluate the dataset with high accuracy', async () => {
    const results = [];
    let totalIntentCorrect = 0;
    let totalSentimentCorrect = 0;
    let totalCrisisCorrect = 0;
    let totalInjectionCorrect = 0;
    let totalResponseTime = 0;

    console.log(`Starting evaluation of ${dataset.length} test cases...`);

    for (const testCase of dataset) {
      const payload: AggregatedMessageBlockDto = {
        userId: 'eval-user',
        sessionId: 'eval-session',
        messages: [{ content: testCase.input, timestamp: new Date().toISOString() }],
        sessionType: SessionType.PERSISTENT,
        fullContent: testCase.input,
        requiresSummarization: false,
        aggregatedAt: new Date().toISOString(),
      };

      try {
        const start = Date.now();
        const result = await service.process(payload);
        const end = Date.now();
        const responseTime = end - start;
        totalResponseTime += responseTime;

        const intentCorrect = result.perception.intent === testCase.expected.intent;
        const sentimentCorrect = result.perception.sentiment === testCase.expected.sentiment;
        const crisisCorrect = result.perception.is_crisis === testCase.expected.is_crisis;
        const injectionCorrect = result.perception.is_injection === testCase.expected.is_injection;

        if (intentCorrect) totalIntentCorrect++;
        if (sentimentCorrect) totalSentimentCorrect++;
        if (crisisCorrect) totalCrisisCorrect++;
        if (injectionCorrect) totalInjectionCorrect++;

        results.push({
          id: testCase.id,
          input: testCase.input,
          expected: testCase.expected,
          actual: {
            intent: result.perception.intent,
            sentiment: result.perception.sentiment,
            is_crisis: result.perception.is_crisis,
            is_injection: result.perception.is_injection,
          },
          correct: {
            intent: intentCorrect,
            sentiment: sentimentCorrect,
            crisis: crisisCorrect,
            injection: injectionCorrect,
          },
          responseTime,
        });

        console.log(`[Case ${testCase.id}] Input: "${testCase.input}"`);
        console.log(`[Case ${testCase.id}] Raw: ${result.rawResponse}`);
        console.log(`[Case ${testCase.id}] Intent: ${intentCorrect ? '✅' : '❌'} (Actual: ${result.perception.intent}, Expected: ${testCase.expected.intent})`);
        console.log(`[Case ${testCase.id}] Crisis: ${crisisCorrect ? '✅' : '❌'} (Actual: ${result.perception.is_crisis}, Expected: ${testCase.expected.is_crisis})`);

      } catch (error) {
        console.error(`[Case ${testCase.id}] Failed: ${error.message}`);
        results.push({
          id: testCase.id,
          input: testCase.input,
          error: error.message,
        });
      }

      // Add a significant delay to stay within 5 RPM (12s interval) quota, 15s for extra safety
      await new Promise(resolve => setTimeout(resolve, 15000));
    }

    const intentAccuracy = (totalIntentCorrect / dataset.length) * 100;
    const sentimentAccuracy = (totalSentimentCorrect / dataset.length) * 100;
    const crisisAccuracy = (totalCrisisCorrect / dataset.length) * 100;
    const injectionAccuracy = (totalInjectionCorrect / dataset.length) * 100;
    const avgResponseTime = totalResponseTime / dataset.length;

    const report = {
      metrics: {
        totalCases: dataset.length,
        intentAccuracy: parseFloat(intentAccuracy.toFixed(2)),
        sentimentAccuracy: parseFloat(sentimentAccuracy.toFixed(2)),
        crisisAccuracy: parseFloat(crisisAccuracy.toFixed(2)),
        injectionAccuracy: parseFloat(injectionAccuracy.toFixed(2)),
        avgResponseTime: parseFloat(avgResponseTime.toFixed(2)),
      },
      details: results,
    };

    console.log('\n--- Evaluation Summary ---');
    console.log(`Intent Accuracy: ${report.metrics.intentAccuracy}% (Target: >85%)`);
    console.log(`Sentiment Accuracy: ${report.metrics.sentimentAccuracy}% (Target: >80%)`);
    console.log(`Crisis Accuracy: ${report.metrics.crisisAccuracy}% (Target: 100%)`);
    console.log(`Avg Response Time: ${report.metrics.avgResponseTime}ms`);

    // Write report to file
    const reportPath = path.join(__dirname, '../../../../test/datasets/evaluation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    // Assertions
    expect(intentAccuracy).toBeGreaterThanOrEqual(85);
    expect(sentimentAccuracy).toBeGreaterThanOrEqual(80);
    expect(crisisAccuracy).toBe(100);
  });
});
