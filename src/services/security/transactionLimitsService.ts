import { createLoggerWithFunction } from '../../logger';
import { cacheService } from '../cache';

/**
 * Transaction Limits Service
 * 
 * Manages transaction limits and restrictions
 */
export interface TransactionLimit {
  userId: string;
  dailyLimit: string; // Amount in wei or token units
  weeklyLimit: string;
  monthlyLimit: string;
  perTransactionLimit: string;
  dailyCount: number; // Number of transactions per day
  weeklyCount: number;
  monthlyCount: number;
  resetAt: Date; // When limits reset
}

export interface LimitUsage {
  daily: {
    amount: string;
    count: number;
    limit: string;
    remaining: string;
  };
  weekly: {
    amount: string;
    count: number;
    limit: string;
    remaining: string;
  };
  monthly: {
    amount: string;
    count: number;
    limit: string;
    remaining: string;
  };
  perTransaction: {
    limit: string;
  };
}

export class TransactionLimitsService {
  private static logger = createLoggerWithFunction('TransactionLimitsService', { module: 'security' });

  /**
   * Set transaction limits for a user
   */
  static async setLimits(
    userId: string,
    limits: Partial<Pick<TransactionLimit, 'dailyLimit' | 'weeklyLimit' | 'monthlyLimit' | 'perTransactionLimit' | 'dailyCount' | 'weeklyCount' | 'monthlyCount'>>
  ): Promise<TransactionLimit> {
    const logger = createLoggerWithFunction('setLimits', { module: 'security' });
    
    try {
      const existing = await this.getLimits(userId);
      
      const updated: TransactionLimit = {
        userId,
        dailyLimit: limits.dailyLimit ?? existing?.dailyLimit ?? '0',
        weeklyLimit: limits.weeklyLimit ?? existing?.weeklyLimit ?? '0',
        monthlyLimit: limits.monthlyLimit ?? existing?.monthlyLimit ?? '0',
        perTransactionLimit: limits.perTransactionLimit ?? existing?.perTransactionLimit ?? '0',
        dailyCount: limits.dailyCount ?? existing?.dailyCount ?? 0,
        weeklyCount: limits.weeklyCount ?? existing?.weeklyCount ?? 0,
        monthlyCount: limits.monthlyCount ?? existing?.monthlyCount ?? 0,
        resetAt: existing?.resetAt || new Date()
      };

      const cacheKey = `limits:${userId}`;
      await cacheService.set(cacheKey, JSON.stringify(updated), 86400 * 365);

      logger.info({ userId }, 'Transaction limits updated');

      return updated;
    } catch (error: any) {
      logger.error({ userId, error: error.message }, 'Failed to set transaction limits');
      throw error;
    }
  }

  /**
   * Get transaction limits for a user
   */
  static async getLimits(userId: string): Promise<TransactionLimit | null> {
    const cacheKey = `limits:${userId}`;
    const cached = await cacheService.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    return null;
  }

  /**
   * Check if transaction is within limits
   */
  static async checkLimit(
    userId: string,
    amount: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const logger = createLoggerWithFunction('checkLimit', { module: 'security' });
    
    try {
      const limits = await this.getLimits(userId);
      if (!limits) {
        return { allowed: true }; // No limits set
      }

      // Check per-transaction limit
      if (limits.perTransactionLimit !== '0') {
        const perTxLimit = BigInt(limits.perTransactionLimit);
        const txAmount = BigInt(amount);
        if (txAmount > perTxLimit) {
          return {
            allowed: false,
            reason: `Transaction amount exceeds per-transaction limit of ${limits.perTransactionLimit}`
          };
        }
      }

      // Get current usage
      const usage = await this.getUsage(userId);
      
      // Check daily limit
      if (limits.dailyLimit !== '0') {
        const dailyLimit = BigInt(limits.dailyLimit);
        const dailyUsed = BigInt(usage.daily.amount);
        const newDailyTotal = dailyUsed + BigInt(amount);
        if (newDailyTotal > dailyLimit) {
          return {
            allowed: false,
            reason: `Transaction would exceed daily limit of ${limits.dailyLimit}`
          };
        }
      }

      // Check daily count limit
      if (limits.dailyCount > 0 && usage.daily.count >= limits.dailyCount) {
        return {
          allowed: false,
          reason: `Daily transaction count limit reached (${limits.dailyCount})`
        };
      }

      // Check weekly limit
      if (limits.weeklyLimit !== '0') {
        const weeklyLimit = BigInt(limits.weeklyLimit);
        const weeklyUsed = BigInt(usage.weekly.amount);
        const newWeeklyTotal = weeklyUsed + BigInt(amount);
        if (newWeeklyTotal > weeklyLimit) {
          return {
            allowed: false,
            reason: `Transaction would exceed weekly limit of ${limits.weeklyLimit}`
          };
        }
      }

      // Check weekly count limit
      if (limits.weeklyCount > 0 && usage.weekly.count >= limits.weeklyCount) {
        return {
          allowed: false,
          reason: `Weekly transaction count limit reached (${limits.weeklyCount})`
        };
      }

      // Check monthly limit
      if (limits.monthlyLimit !== '0') {
        const monthlyLimit = BigInt(limits.monthlyLimit);
        const monthlyUsed = BigInt(usage.monthly.amount);
        const newMonthlyTotal = monthlyUsed + BigInt(amount);
        if (newMonthlyTotal > monthlyLimit) {
          return {
            allowed: false,
            reason: `Transaction would exceed monthly limit of ${limits.monthlyLimit}`
          };
        }
      }

      // Check monthly count limit
      if (limits.monthlyCount > 0 && usage.monthly.count >= limits.monthlyCount) {
        return {
          allowed: false,
          reason: `Monthly transaction count limit reached (${limits.monthlyCount})`
        };
      }

      return { allowed: true };
    } catch (error: any) {
      logger.error({ userId, amount, error: error.message }, 'Failed to check transaction limit');
      return { allowed: false, reason: 'Error checking limits' };
    }
  }

  /**
   * Record transaction usage
   */
  static async recordTransaction(
    userId: string,
    amount: string
  ): Promise<void> {
    const logger = createLoggerWithFunction('recordTransaction', { module: 'security' });
    
    try {
      const now = new Date();
      const usageKey = `usage:${userId}`;
      const cached = await cacheService.get(usageKey);
      
      let usage: {
        daily: { amount: string; count: number; date: string };
        weekly: { amount: string; count: number; week: string };
        monthly: { amount: string; count: number; month: string };
      };

      if (cached) {
        usage = JSON.parse(cached);
      } else {
        usage = {
          daily: { amount: '0', count: 0, date: now.toISOString().split('T')[0] },
          weekly: { amount: '0', count: 0, week: this.getWeekKey(now) },
          monthly: { amount: '0', count: 0, month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}` }
        };
      }

      // Reset daily if new day
      const today = now.toISOString().split('T')[0];
      if (usage.daily.date !== today) {
        usage.daily = { amount: '0', count: 0, date: today };
      }

      // Reset weekly if new week
      const weekKey = this.getWeekKey(now);
      if (usage.weekly.week !== weekKey) {
        usage.weekly = { amount: '0', count: 0, week: weekKey };
      }

      // Reset monthly if new month
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      if (usage.monthly.month !== monthKey) {
        usage.monthly = { amount: '0', count: 0, month: monthKey };
      }

      // Update usage
      usage.daily.amount = (BigInt(usage.daily.amount) + BigInt(amount)).toString();
      usage.daily.count += 1;
      usage.weekly.amount = (BigInt(usage.weekly.amount) + BigInt(amount)).toString();
      usage.weekly.count += 1;
      usage.monthly.amount = (BigInt(usage.monthly.amount) + BigInt(amount)).toString();
      usage.monthly.count += 1;

      await cacheService.set(usageKey, JSON.stringify(usage), 86400 * 32); // 32 days
    } catch (error: any) {
      logger.error({ userId, amount, error: error.message }, 'Failed to record transaction');
    }
  }

  /**
   * Get current usage
   */
  static async getUsage(userId: string): Promise<LimitUsage> {
    const limits = await this.getLimits(userId);
    const usageKey = `usage:${userId}`;
    const cached = await cacheService.get(usageKey);
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekKey = this.getWeekKey(now);
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let usage: {
      daily: { amount: string; count: number; date: string };
      weekly: { amount: string; count: number; week: string };
      monthly: { amount: string; count: number; month: string };
    };

    if (cached) {
      usage = JSON.parse(cached);
      
      // Reset if period changed
      if (usage.daily.date !== today) {
        usage.daily = { amount: '0', count: 0, date: today };
      }
      if (usage.weekly.week !== weekKey) {
        usage.weekly = { amount: '0', count: 0, week: weekKey };
      }
      if (usage.monthly.month !== monthKey) {
        usage.monthly = { amount: '0', count: 0, month: monthKey };
      }
    } else {
      usage = {
        daily: { amount: '0', count: 0, date: today },
        weekly: { amount: '0', count: 0, week: weekKey },
        monthly: { amount: '0', count: 0, month: monthKey }
      };
    }

    return {
      daily: {
        amount: usage.daily.amount,
        count: usage.daily.count,
        limit: limits?.dailyLimit || '0',
        remaining: limits?.dailyLimit ? (BigInt(limits.dailyLimit) - BigInt(usage.daily.amount)).toString() : '0'
      },
      weekly: {
        amount: usage.weekly.amount,
        count: usage.weekly.count,
        limit: limits?.weeklyLimit || '0',
        remaining: limits?.weeklyLimit ? (BigInt(limits.weeklyLimit) - BigInt(usage.weekly.amount)).toString() : '0'
      },
      monthly: {
        amount: usage.monthly.amount,
        count: usage.monthly.count,
        limit: limits?.monthlyLimit || '0',
        remaining: limits?.monthlyLimit ? (BigInt(limits.monthlyLimit) - BigInt(usage.monthly.amount)).toString() : '0'
      },
      perTransaction: {
        limit: limits?.perTransactionLimit || '0'
      }
    };
  }

  /**
   * Get week key (YYYY-WW format)
   */
  private static getWeekKey(date: Date): string {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
  }
}

