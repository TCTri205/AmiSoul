import { Injectable, Logger } from '@nestjs/common';

export interface ContextData {
  persona?: string;
  vibe?: string;
  memories?: string[];
  history?: { role: string; content: string }[];
  userInput: string;
}

@Injectable()
export class TokenBudgetManager {
  private readonly logger = new Logger(TokenBudgetManager.name);

  private readonly MAX_TOTAL_TOKENS = 3000;
  private readonly CHARS_PER_TOKEN = 4; // Approximation

  /**
   * Prunes the context data to fit within the token budget.
   * Priority: UserInput > Persona > Vibe > History (Newest) > Memories
   */
  prune(data: ContextData): ContextData {
    const pruned = { ...data };
    
    let currentTokens = this.calculateTotalTokens(pruned);

    if (currentTokens <= this.MAX_TOTAL_TOKENS) {
      return pruned;
    }

    this.logger.debug(`Budget exceeded (${currentTokens}/${this.MAX_TOTAL_TOKENS}). Pruning...`);

    // 1. Prune Memories first (oldest or least relevant, here just all if needed)
    if (pruned.memories && pruned.memories.length > 0) {
      while (currentTokens > this.MAX_TOTAL_TOKENS && pruned.memories.length > 0) {
        pruned.memories.pop(); // Remove one memory at a time
        currentTokens = this.calculateTotalTokens(pruned);
      }
    }

    // 2. Prune History (oldest first)
    if (currentTokens > this.MAX_TOTAL_TOKENS && pruned.history && pruned.history.length > 0) {
      while (currentTokens > this.MAX_TOTAL_TOKENS && pruned.history.length > 0) {
        pruned.history.shift(); // Remove oldest message
        currentTokens = this.calculateTotalTokens(pruned);
      }
    }

    // 3. Prune Vibe if still over (Rare)
    if (currentTokens > this.MAX_TOTAL_TOKENS && pruned.vibe) {
      pruned.vibe = pruned.vibe.substring(0, pruned.vibe.length / 2);
      currentTokens = this.calculateTotalTokens(pruned);
    }

    this.logger.debug(`Pruning complete. Final tokens: ${currentTokens}`);
    return pruned;
  }

  private calculateTotalTokens(data: ContextData): number {
    let text = data.userInput + (data.persona || '') + (data.vibe || '');
    
    if (data.memories) {
      text += data.memories.join(' ');
    }

    if (data.history) {
      text += data.history.map(h => h.content).join(' ');
    }

    return Math.ceil(text.length / this.CHARS_PER_TOKEN);
  }

  getBudgetInfo(data: ContextData) {
    return {
      total: this.calculateTotalTokens(data),
      limit: this.MAX_TOTAL_TOKENS,
    };
  }
}
