export class PerceptionResultDto {
  intent: 'greeting' | 'question' | 'venting' | 'sharing' | 'seeking_advice' | 'closing' | 'forget_me' | 'delete_memory' | 'factual_query' | 'unknown';
  sentiment: 'positive' | 'neutral' | 'negative';
  complexity: number; // 1-10
  urgency: number; // 1-10
  identity_anomaly: boolean;
  routing_confidence: number; // 0.0 - 1.0
  sarcasm_hint: boolean;
  timestamp_flag: boolean;
  noise_flag: boolean;
  is_crisis: boolean;
  is_injection: boolean;
  injection_reason?: string;
  summary?: string;
}
