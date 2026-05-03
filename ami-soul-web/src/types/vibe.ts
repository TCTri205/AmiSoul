export type SessionVibe = 'positive' | 'neutral' | 'stressed' | 'crisis' | 'offline';

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting';

export interface VibeState {
  sessionVibe: SessionVibe;
  bondingScore: number;
  connectionStatus: ConnectionStatus;
}
