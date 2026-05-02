export class PerceptionResultDto {
  intent: string;
  sentiment: string;
  complexity: number;
  urgency: number;
  identity_anomaly: boolean;
  summary?: string;
}
