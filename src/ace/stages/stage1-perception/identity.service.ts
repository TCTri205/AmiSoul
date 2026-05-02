import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../redis/redis.service';
import { AggregatedMessageBlockDto } from '../stage0-aggregator/dto/aggregated-message-block.dto';
import { IdentityAnomalyResultDto } from './dto/identity-anomaly-result.dto';

interface BehavioralSignature {
  avgTypingSpeed: number; // chars per second
  avgSentenceLength: number; // words per sentence
  topWords: Record<string, number>; // word -> frequency
  sampleSize: number; // number of message blocks analyzed
  lastUpdated: string;
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private readonly SIGNATURE_KEY_PREFIX = 'user:behavioral_signature:';
  private readonly DEVIATION_THRESHOLD = 0.7;
  private readonly MIN_BONDING_FOR_CHECK = 10;

  constructor(private readonly redis: RedisService) {}

  async calculateAnomaly(
    userId: string,
    payload: AggregatedMessageBlockDto,
    bondingScore: number,
  ): Promise<IdentityAnomalyResultDto> {
    // 1. Cold Start Bypass
    if (bondingScore < this.MIN_BONDING_FOR_CHECK) {
      return {
        anomalyScore: 0,
        isBypassed: true,
        reason: 'Cold Start: Bonding score too low (< 10)',
      };
    }

    // 2. Fetch Signature from Redis
    const signatureRaw = await this.redis.get(`${this.SIGNATURE_KEY_PREFIX}${userId}`);
    if (!signatureRaw) {
      return {
        anomalyScore: 0,
        isBypassed: true,
        reason: 'Cold Start: No behavioral signature baseline found',
      };
    }

    let signature: BehavioralSignature;
    try {
      signature = JSON.parse(signatureRaw);
    } catch (e) {
      this.logger.error(`Failed to parse behavioral signature for ${userId}: ${e.message}`);
      return { anomalyScore: 0, isBypassed: true };
    }

    // 3. Calculate Current Metrics
    const metrics = this.extractMetrics(payload);
    if (!metrics || metrics.words.length === 0) {
      return {
        anomalyScore: 0,
        isBypassed: true,
        reason: 'Insufficient data in message block',
      };
    }

    // 4. Calculate Deviations
    const speedDeviation = this.calculateDeviation(metrics.typingSpeed, signature.avgTypingSpeed);
    const lengthDeviation = this.calculateDeviation(metrics.sentenceLength, signature.avgSentenceLength);
    const vocabDeviation = this.calculateVocabDeviation(metrics.words, signature.topWords);

    // Weighted average
    const totalScore = (speedDeviation * 0.4) + (lengthDeviation * 0.3) + (vocabDeviation * 0.3);

    this.logger.debug(
      `Identity check for ${userId}: Speed Dev: ${speedDeviation.toFixed(2)}, Length Dev: ${lengthDeviation.toFixed(2)}, Vocab Dev: ${vocabDeviation.toFixed(2)}, Total: ${totalScore.toFixed(2)}`,
    );

    return {
      anomalyScore: totalScore,
      isBypassed: false,
      metrics,
    };
  }

  async updateSignature(userId: string, payload: AggregatedMessageBlockDto): Promise<void> {
    const metrics = this.extractMetrics(payload);
    if (!metrics) return;

    const key = `${this.SIGNATURE_KEY_PREFIX}${userId}`;
    const signatureRaw = await this.redis.get(key);
    
    let signature: BehavioralSignature;
    if (signatureRaw) {
      signature = JSON.parse(signatureRaw);
      // Moving average update
      const n = signature.sampleSize;
      signature.avgTypingSpeed = (signature.avgTypingSpeed * n + metrics.typingSpeed) / (n + 1);
      signature.avgSentenceLength = (signature.avgSentenceLength * n + metrics.sentenceLength) / (n + 1);
      
      // Merge vocabulary (simplified: just add counts and keep top 20)
      for (const word of metrics.words) {
        signature.topWords[word] = (signature.topWords[word] || 0) + 1;
      }
      // Prune if too large
      if (Object.keys(signature.topWords).length > 50) {
        signature.topWords = Object.fromEntries(
          Object.entries(signature.topWords)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
        );
      }
      
      signature.sampleSize = n + 1;
    } else {
      const topWords: Record<string, number> = {};
      metrics.words.forEach(w => { topWords[w] = (topWords[w] || 0) + 1; });
      
      signature = {
        avgTypingSpeed: metrics.typingSpeed,
        avgSentenceLength: metrics.sentenceLength,
        topWords,
        sampleSize: 1,
        lastUpdated: new Date().toISOString(),
      };
    }

    signature.lastUpdated = new Date().toISOString();
    await this.redis.set(key, JSON.stringify(signature));
  }

  private extractMetrics(payload: AggregatedMessageBlockDto) {
    if (!payload.messages || payload.messages.length === 0) return null;

    const fullText = payload.fullContent;
    const charCount = fullText.length;
    // Extract words, lowercased and stripped of punctuation
    const words = fullText.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // replace punctuation with space
      .split(/\s+/)
      .filter(w => w.length > 2); 
    const wordCount = words.length;
    
    // Estimate sentences by punctuation
    const sentenceCount = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0).length || 1;

    // Calculate duration
    const startTs = new Date(payload.messages[0].timestamp).getTime();
    const endTs = new Date(payload.messages[payload.messages.length - 1].timestamp).getTime();
    
    const durationSeconds = Math.max((endTs - startTs) / 1000, 1);

    return {
      typingSpeed: charCount / durationSeconds,
      sentenceLength: wordCount / sentenceCount,
      words,
    };
  }

  private calculateDeviation(current: number, baseline: number): number {
    if (baseline === 0) return 0;
    const deviation = Math.abs(current - baseline) / baseline;
    return Math.min(deviation, 1.0);
  }

  private calculateVocabDeviation(currentWords: string[], topWords: Record<string, number>): number {
    if (!topWords || Object.keys(topWords).length === 0) return 0;
    
    // Only check vocabulary if the message block is long enough to be representative
    if (currentWords.length < 10) return 0;

    // Check how many of the top words in signature appear in current block
    const topBaselineWords = Object.keys(topWords)
      .sort((a, b) => topWords[b] - topWords[a])
      .slice(0, 15);
      
    const uniqueCurrentWords = new Set(currentWords);
    
    let matchCount = 0;
    for (const word of topBaselineWords) {
      if (uniqueCurrentWords.has(word)) matchCount++;
    }

    // Heuristic: Matching at least 2 of your top 15 words in a 10+ word block is "normal".
    // This is a very loose check to avoid false positives.
    const matchRatio = matchCount / 2; 
    const deviation = 1 - Math.min(matchRatio, 1.0);
    
    return deviation;
  }
}
