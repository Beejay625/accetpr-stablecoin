import { createLoggerWithFunction } from '../../logger';
import { PaymentRepository } from '../../repositories/database/payment/paymentRepository';

interface DayData {
  date: string;
  dayOfWeek: number;
  dayName: string;
  amount: string;
  count: number;
}

interface WeekData {
  weekStartDate: string;
  days: DayData[];
}

interface BestDayData {
  date: string;
  dayOfWeek: number;
  dayName: string;
  amount: string;
  count: number;
}

interface HeatmapSummary {
  totalSales: string;
  avgDailySales: string;
  bestDay: BestDayData;
}

interface HeatmapMetadata {
  startDate: string;
  endDate: string;
  totalDays: number;
  totalWeeks: number;
}

interface HeatmapData {
  weeks: WeekData[];
  summary: HeatmapSummary;
  metadata: HeatmapMetadata;
}

/**
 * Heatmap Service
 * 
 * Handles sales activity heatmap generation with GitHub-style grid structure.
 * Returns 365 days of data organized into weeks for easy frontend rendering.
 */
export class HeatmapService {
  private static logger = createLoggerWithFunction('HeatmapService', { module: 'service' });

  /**
   * Get sales heatmap data for the last 365 days
   * Returns data structured as weeks for GitHub-style visualization
   * Shows performance across ALL products created by the user
   * 
   * @param userId - The user ID to filter by
   * @returns Promise<HeatmapData>
   */
  static async getSalesHeatmap(userId: string): Promise<HeatmapData> {
    this.logger.info('getSalesHeatmap', { userId }, 'Getting sales heatmap for all user products');

    const rawData = await PaymentRepository.getSalesHeatmapData(userId);
    
    // Create the grid structure (365 days organized into weeks)
    const weeks = this.createWeekStructure(rawData);
    
    // Calculate summary statistics
    const allDays = weeks.flatMap(week => week.days);
    const summary = this.calculateSummary(allDays);
    
    // Create metadata
    const metadata = this.createMetadata();
    
    const result: HeatmapData = {
      weeks,
      summary,
      metadata
    };

    this.logger.info('getSalesHeatmap', { 
      userId, 
      totalWeeks: weeks.length,
      totalDays: allDays.length
    }, 'Sales heatmap generated successfully');

    return result;
  }

  /**
   * Create week structure from raw data
   * Organizes 365 days into ~52-53 weeks starting from 365 days ago
   */
  private static createWeekStructure(rawData: Array<{ date: Date; amount: number; count: number }>): WeekData[] {
    // Helper function to safely extract date string
    const getDateString = (date: Date): string => {
      return date.toISOString().split('T')[0] || date.toISOString().substring(0, 10);
    };

    // Create a map for quick lookup of actual data
    const dataMap = new Map<string, { amount: number; count: number }>();
    rawData.forEach(item => {
      const dateStr = getDateString(item.date);
      dataMap.set(dateStr, { amount: item.amount, count: item.count });
    });

    // Generate 365 days starting from 365 days ago
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364); // 364 days ago to include today (365 total)

    // Find the start of the week containing startDate (Sunday)
    const weekStart = new Date(startDate);
    weekStart.setDate(weekStart.getDate() - startDate.getDay());

    const weeks: WeekData[] = [];
    let currentWeekStart = new Date(weekStart);
    
    // Generate weeks until we cover all 365 days
    while (weeks.length < 53) { // Max 53 weeks to cover 365 days
      const weekDays: DayData[] = [];
      
      // Generate 7 days for this week
      for (let i = 0; i < 7; i++) {
        const currentDate = new Date(currentWeekStart);
        currentDate.setDate(currentWeekStart.getDate() + i);
        const dateStr = getDateString(currentDate);
        
        // Skip dates before our 365-day range
        if (currentDate < startDate) {
          weekDays.push({
            date: dateStr,
            dayOfWeek: i,
            dayName: this.getDayName(i),
            amount: '0.00',
            count: 0
          });
          continue;
        }
        
        // Skip dates after today
        if (currentDate > today) {
          weekDays.push({
            date: dateStr,
            dayOfWeek: i,
            dayName: this.getDayName(i),
            amount: '0.00',
            count: 0
          });
          continue;
        }
        
        // Check if we have data for this date
        const dayData = dataMap.get(dateStr);
        
        if (dayData) {
          // Convert cents to dollars
          const amountDollars = (dayData.amount / 100).toFixed(2);
          weekDays.push({
            date: dateStr,
            dayOfWeek: i,
            dayName: this.getDayName(i),
            amount: amountDollars,
            count: dayData.count
          });
        } else {
          // No data for this date
          weekDays.push({
            date: dateStr,
            dayOfWeek: i,
            dayName: this.getDayName(i),
            amount: '0.00',
            count: 0
          });
        }
      }
      
      weeks.push({
        weekStartDate: getDateString(currentWeekStart),
        days: weekDays
      });
      
      // Move to next week
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      
      // Stop if we've covered enough weeks
      if (weeks.length >= 52 && currentWeekStart > today) {
        break;
      }
    }

    return weeks;
  }

  /**
   * Get day name from day of week number
   */
  private static getDayName(dayOfWeek: number): string {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[dayOfWeek] || 'Sun';
  }

  /**
   * Calculate summary statistics
   */
  private static calculateSummary(allDays: DayData[]): HeatmapSummary {
    let totalSalesCents = 0;
    let totalCount = 0;
    let bestDay: DayData | null = null;
    let bestAmount = 0;

    allDays.forEach(day => {
      const amountCents = parseFloat(day.amount) * 100;
      totalSalesCents += amountCents;
      totalCount += day.count;

      // Find best day (highest amount, tiebreaker: count)
      if (amountCents > bestAmount || 
          (amountCents === bestAmount && day.count > (bestDay?.count || 0))) {
        bestAmount = amountCents;
        bestDay = day;
      }
    });

    const avgDailySales = totalSalesCents / 365 / 100; // Convert to dollars

    // Create bestDay result with proper type checking
    let bestDayResult: BestDayData;
    if (bestDay !== null) {
      const bestDayData = bestDay as DayData; // Type assertion for null check
      bestDayResult = {
        date: bestDayData.date,
        dayOfWeek: bestDayData.dayOfWeek,
        dayName: bestDayData.dayName,
        amount: bestDayData.amount,
        count: bestDayData.count
      };
    } else {
      bestDayResult = {
        date: '',
        dayOfWeek: 0,
        dayName: 'Sun',
        amount: '0.00',
        count: 0
      };
    }

    return {
      totalSales: (totalSalesCents / 100).toFixed(2),
      avgDailySales: avgDailySales.toFixed(2),
      bestDay: bestDayResult
    };
  }

  /**
   * Create metadata for the heatmap
   */
  private static createMetadata(): HeatmapMetadata {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 364);

    // Helper function to safely extract date string
    const getDateString = (date: Date): string => {
      return date.toISOString().split('T')[0] || date.toISOString().substring(0, 10);
    };

    return {
      startDate: getDateString(startDate),
      endDate: getDateString(endDate),
      totalDays: 365,
      totalWeeks: 53
    };
  }
}
