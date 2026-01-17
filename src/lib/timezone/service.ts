/**
 * Timezone Service - Single Source of Truth
 * 
 * @module lib/timezone
 * @version RISE V3 Compliant - Solution C (10.0 score)
 * 
 * Uses Intl.DateTimeFormat for accurate timezone conversions.
 * Handles DST (Daylight Saving Time) automatically.
 * 
 * This is the ONLY place where timezone conversion logic should exist.
 * All other modules MUST use this service.
 */

import type { 
  IANATimezone, 
  DateBoundaries, 
  FormattedDateTime, 
  TimezoneConfig 
} from './types';
import { DEFAULT_CONFIG } from './constants';

/**
 * TimezoneService class - immutable, stateless conversions
 * 
 * @example
 * const service = new TimezoneService({ timezone: 'America/Sao_Paulo' });
 * const { startOfDay, endOfDay } = service.getDateBoundaries(new Date());
 */
export class TimezoneService {
  private readonly config: TimezoneConfig;
  private readonly dateFormatter: Intl.DateTimeFormat;
  private readonly timeFormatter: Intl.DateTimeFormat;
  private readonly fullFormatter: Intl.DateTimeFormat;
  private readonly hourFormatter: Intl.DateTimeFormat;

  constructor(config: Partial<TimezoneConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Date only formatter (dd/MM/yyyy)
    this.dateFormatter = new Intl.DateTimeFormat(this.config.locale, {
      timeZone: this.config.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    
    // Time only formatter (HH:mm)
    this.timeFormatter = new Intl.DateTimeFormat(this.config.locale, {
      timeZone: this.config.timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    
    // Full datetime formatter (dd/MM/yyyy HH:mm)
    this.fullFormatter = new Intl.DateTimeFormat(this.config.locale, {
      timeZone: this.config.timezone,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Hour only formatter for chart calculations
    this.hourFormatter = new Intl.DateTimeFormat(this.config.locale, {
      timeZone: this.config.timezone,
      hour: '2-digit',
      hour12: false,
    });
  }

  /**
   * Get the configured timezone
   */
  get timezone(): IANATimezone {
    return this.config.timezone;
  }

  /**
   * Get the configured locale
   */
  get locale(): string {
    return this.config.locale;
  }

  /**
   * Convert a Date object to start/end of day boundaries for database queries
   * 
   * @param date - The date to get boundaries for
   * @returns ISO strings adjusted for the configured timezone
   * 
   * @example
   * // For America/Sao_Paulo (UTC-3):
   * // Input: 2026-01-15 (any time)
   * // Output:
   * //   startOfDay: "2026-01-15T03:00:00.000Z" (00:00 SP = 03:00 UTC)
   * //   endOfDay: "2026-01-16T02:59:59.999Z" (23:59:59.999 SP = next day 02:59 UTC)
   */
  getDateBoundaries(date: Date): DateBoundaries {
    // Get date parts in the target timezone using formatToParts
    const parts = this.dateFormatter.formatToParts(date);
    
    const yearPart = parts.find(p => p.type === 'year');
    const monthPart = parts.find(p => p.type === 'month');
    const dayPart = parts.find(p => p.type === 'day');
    
    if (!yearPart || !monthPart || !dayPart) {
      throw new Error('Failed to parse date parts');
    }
    
    const year = parseInt(yearPart.value, 10);
    const month = parseInt(monthPart.value, 10) - 1; // JS months are 0-indexed
    const day = parseInt(dayPart.value, 10);

    // Create start of day (00:00:00.000) in local time
    const startLocal = new Date(year, month, day, 0, 0, 0, 0);
    
    // Create end of day (23:59:59.999) in local time
    const endLocal = new Date(year, month, day, 23, 59, 59, 999);

    // Calculate timezone offset for start and end (handles DST transitions)
    const startOffset = this.getTimezoneOffsetMs(startLocal);
    const endOffset = this.getTimezoneOffsetMs(endLocal);

    // Convert to UTC by subtracting the offset
    const startUTC = new Date(startLocal.getTime() - startOffset);
    const endUTC = new Date(endLocal.getTime() - endOffset);

    return {
      startOfDay: startUTC.toISOString(),
      endOfDay: endUTC.toISOString(),
    };
  }

  /**
   * Get start of day ISO string for database queries
   */
  toStartOfDay(date: Date): string {
    return this.getDateBoundaries(date).startOfDay;
  }

  /**
   * Get end of day ISO string for database queries
   */
  toEndOfDay(date: Date): string {
    return this.getDateBoundaries(date).endOfDay;
  }

  /**
   * Get the hour (0-23) in the configured timezone
   * 
   * @param date - Date object or ISO string
   * @returns Hour in the configured timezone (0-23)
   * 
   * @example
   * // Sale at 00:50 UTC = 21:50 São Paulo
   * service.getHourInTimezone('2026-01-16T00:50:00.000Z') // Returns 21
   */
  getHourInTimezone(date: Date | string): number {
    const d = typeof date === 'string' ? new Date(date) : date;
    const parts = this.hourFormatter.formatToParts(d);
    const hourPart = parts.find(p => p.type === 'hour');
    return parseInt(hourPart?.value || '0', 10);
  }

  /**
   * Get the date in the configured timezone as YYYY-MM-DD
   * 
   * @param date - Date object or ISO string
   * @returns Date string in YYYY-MM-DD format
   */
  getDateInTimezone(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const parts = this.dateFormatter.formatToParts(d);
    
    const year = parts.find(p => p.type === 'year')?.value || '0000';
    const month = parts.find(p => p.type === 'month')?.value || '01';
    const day = parts.find(p => p.type === 'day')?.value || '01';
    
    return `${year}-${month}-${day}`;
  }

  /**
   * Format a date/time for display
   * 
   * @param date - Date object or ISO string
   * @returns Formatted date, time, full datetime, and relative time
   */
  format(date: Date | string): FormattedDateTime {
    const d = typeof date === 'string' ? new Date(date) : date;
    
    return {
      date: this.dateFormatter.format(d),
      time: this.timeFormatter.format(d),
      full: this.fullFormatter.format(d),
      relative: this.getRelativeTime(d),
    };
  }

  /**
   * Format only the date part (dd/MM/yyyy)
   */
  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.dateFormatter.format(d);
  }

  /**
   * Format only the time part (HH:mm)
   */
  formatTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.timeFormatter.format(d);
  }

  /**
   * Format full datetime (dd/MM/yyyy HH:mm)
   */
  formatFull(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return this.fullFormatter.format(d);
  }

  /**
   * Get relative time string (e.g., "2 horas atrás")
   */
  private getRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffSeconds < 30) return 'Agora';
    if (diffMinutes < 1) return `${diffSeconds}s atrás`;
    if (diffMinutes < 60) return `${diffMinutes} min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} sem atrás`;
    
    return this.dateFormatter.format(date);
  }

  /**
   * Get timezone offset in milliseconds for a specific date
   * Uses Intl API to handle DST correctly
   * 
   * @param date - Date to get offset for
   * @returns Offset in milliseconds (positive = ahead of UTC)
   */
  private getTimezoneOffsetMs(date: Date): number {
    // Format the date in both UTC and target timezone
    const utcFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    
    const tzFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: this.config.timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    // Parse the formatted dates back to timestamps
    const utcDate = new Date(utcFormatter.format(date).replace(',', ''));
    const tzDate = new Date(tzFormatter.format(date).replace(',', ''));
    
    // The difference is the offset
    return tzDate.getTime() - utcDate.getTime();
  }

  /**
   * Create a new service instance with a different timezone
   */
  withTimezone(timezone: IANATimezone): TimezoneService {
    return new TimezoneService({ ...this.config, timezone });
  }

  /**
   * Create a new service instance with a different locale
   */
  withLocale(locale: string): TimezoneService {
    return new TimezoneService({ ...this.config, locale });
  }
}

/**
 * Default singleton instance configured for São Paulo
 * Use this for most cases in the application
 */
export const timezoneService = new TimezoneService();
