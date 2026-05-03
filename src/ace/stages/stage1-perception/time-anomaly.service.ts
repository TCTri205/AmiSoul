import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class TimeAnomalyService {
  private readonly logger = new Logger(TimeAnomalyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Checks for time-related anomalies in a message block.
   */
  async checkAnomaly(userId: string, timestamp: Date): Promise<string | boolean> {
    // 1. Global Rule: Late Night (23:00 - 05:00)
    if (this.isLateNight(timestamp)) {
      return 'Late_Night';
    }

    // 2. Habit Deviation (deviation from typical active hours)
    const isDeviating = await this.checkHabitDeviation(userId, timestamp);
    if (isDeviating) {
      return 'Habit_Deviation';
    }

    return false;
  }

  /**
   * Global rule for "Late Night" messages.
   */
  isLateNight(timestamp: Date): boolean {
    const hour = timestamp.getHours();
    // Rule: 23:00 to 05:00
    return hour >= 23 || hour < 5;
  }

  /**
   * Checks if the message timestamp deviates from the user's typical active hours.
   */
  private async checkHabitDeviation(userId: string, timestamp: Date): Promise<boolean> {
    try {
      const baseline = await this.prisma.behavioralBaseline.findUnique({
        where: { userId },
      });

      if (!baseline) {
        // No baseline yet, cannot detect deviation
        return false;
      }

      const hour = timestamp.getHours();

      // Handle overnight ranges (e.g., 20:00 to 04:00)
      if (baseline.typicalActiveStart <= baseline.typicalActiveEnd) {
        // Normal range (e.g., 08:00 to 22:00)
        return hour < baseline.typicalActiveStart || hour > baseline.typicalActiveEnd;
      }
      // Overnight range (e.g., 22:00 to 06:00)
      return hour < baseline.typicalActiveStart && hour > baseline.typicalActiveEnd;
    } catch (error) {
      this.logger.error(`Error checking habit deviation for user ${userId}: ${error.message}`);
      return false;
    }
  }
}
