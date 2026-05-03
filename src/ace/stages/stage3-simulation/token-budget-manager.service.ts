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
   * Priority (for preservation): UserInput > Persona > Vibe > History (Newest) > Memories (Oldest)
   * Priority (for removal): Memories > History (Oldest first) > Vibe
   */
  prune(data: ContextData): ContextData {
    const pruned = {
      ...data,
      memories: data.memories ? [...data.memories] : [],
      history: data.history ? [...data.history] : [],
    };

    let currentTokens = this.calculateTotalTokens(pruned);

    if (currentTokens <= this.MAX_TOTAL_TOKENS) {
      return pruned;
    }

    this.logger.debug(`Budget exceeded (${currentTokens}/${this.MAX_TOTAL_TOKENS}). Pruning...`);

    // 1. Prune Memories first (Remove one by one)
    if (pruned.memories && pruned.memories.length > 0) {
      while (currentTokens > this.MAX_TOTAL_TOKENS && pruned.memories.length > 0) {
        pruned.memories.pop(); // Assuming last added is least important or just simple pop
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

    // 3. Prune Vibe if still over (XML-aware truncation)
    if (currentTokens > this.MAX_TOTAL_TOKENS && pruned.vibe) {
      while (currentTokens > this.MAX_TOTAL_TOKENS && pruned.vibe.length > 10) {
        // Truncate by 20% each step for efficiency while checking XML
        const newLength = Math.floor(pruned.vibe.length * 0.8);
        pruned.vibe = this.safeXmlTruncate(pruned.vibe, newLength);
        currentTokens = this.calculateTotalTokens(pruned);
      }
    }

    this.logger.debug(`Pruning complete. Final tokens: ${currentTokens}`);
    return pruned;
  }

  /**
   * Truncates a string while ensuring it doesn't end with a broken XML tag.
   */
  private safeXmlTruncate(text: string, length: number): string {
    let truncated = text.substring(0, length);
    
    // Check if we cut inside a tag <...>
    const lastOpen = truncated.lastIndexOf('<');
    const lastClose = truncated.lastIndexOf('>');

    if (lastOpen > lastClose) {
      // We are inside a tag, cut back to before the tag started
      truncated = truncated.substring(0, lastOpen);
    }

    return truncated.trim();
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
