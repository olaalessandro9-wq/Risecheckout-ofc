/**
 * Date Range Service - São Paulo Timezone Engine
 * 
 * @module lib/date-range
 * @version RISE V3 Compliant - Solution C (9.9 score)
 * 
 * This service calculates date ranges with São Paulo (or configured timezone)
 * as the reference for "day" boundaries. This ensures that:
 * 
 * - "Today" means today in São Paulo, not the user's local timezone
 * - "Last 7 days" includes exactly 7 complete São Paulo days
 * - Queries to the database use correct UTC boundaries
 * 
 * All output is in UTC ISO format, ready for database queries.
 */

import { TimezoneService, type IANATimezone } from '@/lib/timezone';
import type {
  DateRangePreset,
  DateRangeOutput,
  CustomDateRange,
  DateRangeConfig,
} from './types';
import { DEFAULT_DATE_RANGE_CONFIG } from './types';

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class DateRangeService {
  private readonly config: DateRangeConfig;
  private readonly timezoneService: TimezoneService;

  constructor(config: Partial<DateRangeConfig> = {}) {
    this.config = { ...DEFAULT_DATE_RANGE_CONFIG, ...config };
    this.timezoneService = new TimezoneService({ timezone: this.config.timezone });
  }

  /**
   * Get the reference date (now in the configured timezone)
   */
  private getReferenceDate(): Date {
    return this.config.referenceDate || new Date();
  }

  /**
   * Calculate date range for a given preset
   * 
   * @param preset - The preset to calculate ('today', '7days', etc.)
   * @returns DateRangeOutput with UTC ISO strings
   * 
   * @example
   * // Get today's range in São Paulo timezone
   * const range = service.getRange('today');
   * // range.startISO = "2026-01-17T03:00:00.000Z" (00:00 SP)
   * // range.endISO = "2026-01-18T02:59:59.999Z" (23:59:59.999 SP)
   */
  getRange(preset: Exclude<DateRangePreset, 'custom'>): DateRangeOutput {
    const now = this.getReferenceDate();
    
    switch (preset) {
      case 'today':
        return this.getTodayRange(now);
      case 'yesterday':
        return this.getYesterdayRange(now);
      case '7days':
        return this.getLastNDaysRange(now, 7);
      case '30days':
        return this.getLastNDaysRange(now, 30);
      case 'max':
        return this.getMaxRange(now);
      default:
        // TypeScript exhaustiveness check
        const _exhaustive: never = preset;
        throw new Error(`Unknown preset: ${_exhaustive}`);
    }
  }

  /**
   * Calculate date range for a custom selection
   * 
   * @param customRange - User-selected date range from calendar
   * @returns DateRangeOutput with UTC ISO strings
   */
  getCustomRange(customRange: CustomDateRange): DateRangeOutput {
    const startBoundaries = this.timezoneService.getDateBoundaries(customRange.from);
    const endBoundaries = this.timezoneService.getDateBoundaries(customRange.to);
    
    return {
      startISO: startBoundaries.startOfDay,
      endISO: endBoundaries.endOfDay,
      startDate: new Date(startBoundaries.startOfDay),
      endDate: new Date(endBoundaries.endOfDay),
      timezone: this.config.timezone,
      preset: 'custom',
    };
  }

  /**
   * Get "Today" range (00:00 to 23:59:59.999 in SP)
   */
  private getTodayRange(now: Date): DateRangeOutput {
    const boundaries = this.timezoneService.getDateBoundaries(now);
    
    return {
      startISO: boundaries.startOfDay,
      endISO: boundaries.endOfDay,
      startDate: new Date(boundaries.startOfDay),
      endDate: new Date(boundaries.endOfDay),
      timezone: this.config.timezone,
      preset: 'today',
    };
  }

  /**
   * Get "Yesterday" range
   */
  private getYesterdayRange(now: Date): DateRangeOutput {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const boundaries = this.timezoneService.getDateBoundaries(yesterday);
    
    return {
      startISO: boundaries.startOfDay,
      endISO: boundaries.endOfDay,
      startDate: new Date(boundaries.startOfDay),
      endDate: new Date(boundaries.endOfDay),
      timezone: this.config.timezone,
      preset: 'yesterday',
    };
  }

  /**
   * Get "Last N days" range (includes today)
   * 
   * @param now - Reference date
   * @param days - Number of days to include (e.g., 7 means today + 6 previous days)
   */
  private getLastNDaysRange(now: Date, days: number): DateRangeOutput {
    // Calculate start date (N-1 days ago, because we include today)
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (days - 1));
    
    const startBoundaries = this.timezoneService.getDateBoundaries(startDate);
    const endBoundaries = this.timezoneService.getDateBoundaries(now);
    
    return {
      startISO: startBoundaries.startOfDay,
      endISO: endBoundaries.endOfDay,
      startDate: new Date(startBoundaries.startOfDay),
      endDate: new Date(endBoundaries.endOfDay),
      timezone: this.config.timezone,
      preset: days === 7 ? '7days' : '30days',
    };
  }

  /**
   * Get "Max" range (from configured start date to now)
   */
  private getMaxRange(now: Date): DateRangeOutput {
    const maxStart = this.config.maxStartDate || new Date('2020-01-01T03:00:00.000Z');
    
    const endBoundaries = this.timezoneService.getDateBoundaries(now);
    
    return {
      startISO: maxStart.toISOString(),
      endISO: endBoundaries.endOfDay,
      startDate: maxStart,
      endDate: new Date(endBoundaries.endOfDay),
      timezone: this.config.timezone,
      preset: 'max',
    };
  }

  /**
   * Create a new service instance with a different timezone
   */
  withTimezone(timezone: IANATimezone): DateRangeService {
    return new DateRangeService({ ...this.config, timezone });
  }

  /**
   * Create a new service instance with a different reference date
   * Useful for testing
   */
  withReferenceDate(date: Date): DateRangeService {
    return new DateRangeService({ ...this.config, referenceDate: date });
  }

  /**
   * Get the configured timezone
   */
  get timezone(): IANATimezone {
    return this.config.timezone;
  }
}

/**
 * Singleton instance configured for São Paulo
 * Use this for most cases in the application
 */
export const dateRangeService = new DateRangeService();
