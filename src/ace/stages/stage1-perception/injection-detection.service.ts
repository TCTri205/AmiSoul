import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class InjectionDetectionService {
  private readonly logger = new Logger(InjectionDetectionService.name);

  // Common Prompt Injection Patterns
  private readonly INJECTION_PATTERNS = [
    /ignore (all )?previous instructions/i,
    /system override/i,
    /you are now (a|an|the)/i,
    /acting as/i,
    /disregard/i,
    /stop being/i,
    /start being/i,
    /what is (your )?system prompt/i,
    /(show|reveal|output|display|tell|print).*(system )?prompt/i,
    /output (your )?initial instructions/i,
    /jailbreak/i,
    /DAN mode/i,
    /developer mode/i,
    /end of conversation/i,
    /new instructions/i,
    /forget everything/i,
    /quên (hết|tất cả) (các |mọi )?chỉ dẫn/i,
    /ghi đè (hệ thống|chỉ dẫn)/i,
    /bỏ qua (mọi )?lời nhắc/i,
    /repeat (the )?(words|text|instructions) above/i,
    /tell me (what )?your instructions (are|say)/i,
    /what (are|were) the (first|initial) (words|instructions)/i,
    /no (more )?rules/i,
    /without (any )?restrictions/i,
    /---/, // Delimiters often used to separate payloads
    /===/,
    /\[system\]/i,
    /\[admin\]/i,
    /user:.*assistant:/is, // Attempting to fake a conversation history
  ];

  /**
   * Detects if the given text contains potential prompt injection attempts.
   */
  detect(text: string): { detected: boolean; confidence: number; reason?: string } {
    if (!text) return { detected: false, confidence: 0 };

    // 1. Structural Analysis: Suspiciously high number of delimiters
    // Do this BEFORE pattern matching as it is more general
    const delimiterCount = (text.match(/[-=]{3,}/g) || []).length;
    if (delimiterCount > 3) {
      return {
        detected: true,
        confidence: 0.7,
        reason: 'Excessive delimiters detected',
      };
    }

    // 2. Structural Analysis: Likely Base64 encoding (common for obfuscation)
    // Increased threshold to 64 to avoid matching long IDs or tokens
    const base64Pattern = /\b[A-Za-z0-9+/]{64,}=*\b/;
    if (base64Pattern.test(text)) {
      return {
        detected: true,
        confidence: 0.8,
        reason: 'Suspiciously long Base64-like string detected',
      };
    }

    // 3. Keyword/Pattern Matching
    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        this.logger.warn(`Injection pattern detected: ${pattern}`);
        return {
          detected: true,
          confidence: 0.9,
          reason: `Matched pattern: ${pattern.toString()}`,
        };
      }
    }

    return { detected: false, confidence: 0 };
  }
}
