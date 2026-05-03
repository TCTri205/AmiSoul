export class IdentityAnomalyResultDto {
  anomalyScore: number; // 0.0 - 1.0 (Deviation score)

  isBypassed: boolean; // True if Bonding < 10 or Cold Start

  reason?: string;

  metrics?: {
    typingSpeed: number;
    sentenceLength: number;
    words: string[];
  };
}
