/**
 * @deprecated This module is deprecated. Use @/lib/timezone instead.
 * 
 * MIGRATION GUIDE:
 * ================
 * 
 * Old (deprecated):
 *   import { toUTCStartOfDay, toUTCEndOfDay } from '@/lib/date-utils';
 *   const start = toUTCStartOfDay(date);
 *   const end = toUTCEndOfDay(date);
 * 
 * New (recommended):
 *   import { timezoneService } from '@/lib/timezone';
 *   const start = timezoneService.toStartOfDay(date);
 *   const end = timezoneService.toEndOfDay(date);
 * 
 * Or with destructuring:
 *   const { startOfDay, endOfDay } = timezoneService.getDateBoundaries(date);
 * 
 * PROBLEM WITH THIS MODULE:
 * =========================
 * This module converts dates to UTC midnight, which causes incorrect filtering
 * for vendors in non-UTC timezones (like Brazil, UTC-3). A sale at 21:50 São Paulo
 * (stored as 00:50 UTC next day) would appear on the wrong day in filters.
 * 
 * The new TimezoneService handles this correctly by converting to the vendor's
 * timezone first, then creating the boundaries.
 * 
 * This file will be removed in a future version.
 * 
 * @see src/lib/timezone/service.ts for the replacement
 */

import { timezoneService } from './timezone';

/**
 * @deprecated Use timezoneService.toStartOfDay() instead
 */
export function toUTCStartOfDay(date: Date): string {
  console.warn('[date-utils] toUTCStartOfDay is deprecated. Use timezoneService.toStartOfDay() instead.');
  return timezoneService.toStartOfDay(date);
}

/**
 * @deprecated Use timezoneService.toEndOfDay() instead
 */
export function toUTCEndOfDay(date: Date): string {
  console.warn('[date-utils] toUTCEndOfDay is deprecated. Use timezoneService.toEndOfDay() instead.');
  return timezoneService.toEndOfDay(date);
}

/**
 * @deprecated Use timezoneService.toStartOfDay(new Date()) instead
 */
export function todayUTCStart(): string {
  console.warn('[date-utils] todayUTCStart is deprecated. Use timezoneService.toStartOfDay(new Date()) instead.');
  return timezoneService.toStartOfDay(new Date());
}

/**
 * @deprecated Use timezoneService.toEndOfDay(new Date()) instead
 */
export function todayUTCEnd(): string {
  console.warn('[date-utils] todayUTCEnd is deprecated. Use timezoneService.toEndOfDay(new Date()) instead.');
  return timezoneService.toEndOfDay(new Date());
}
