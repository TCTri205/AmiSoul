import { PerceptionResultDto } from '../../stage1-perception/dto/perception-result.dto';

export interface StoredMemory {
  id: string;
  content: string;
  metadata: any;
  sensitivityLevel: number;
  createdAt: Date;
  similarity: number;
  retrievalScore: number;
}

export interface CalEvent {
  event: string;
  time?: string;
  type: 'expectation' | 'pending' | 'date';
  precision?: 'exact' | 'fuzzy';
  metadata?: any;
}

export class RetrievedContextDto {
  memories: StoredMemory[];

  calEvents: CalEvent[];

  bondingScore: number;

  sessionVibe: string;

  personaShield: string;

  userPersonaModel: any;

  // Budget tracking for Stage 3
  tokenEstimates: {
    persona: number;
    vibe: number;
    memories: number;
    cal: number;
    history: number;
    dpe: number;
  };
}
