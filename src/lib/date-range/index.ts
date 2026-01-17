/**
 * Date Range Module - Barrel Export
 * 
 * @module lib/date-range
 * @version RISE V3 Compliant - Solution C (9.9 score)
 * 
 * Single Source of Truth for all date range calculations.
 * Uses São Paulo timezone as the reference for "day" boundaries.
 * 
 * @example
 * import { dateRangeService, DateRangePreset } from '@/lib/date-range';
 * 
 * // Get "Last 7 days" range for API query
 * const range = dateRangeService.getRange('7days');
 * console.log(range.startISO); // "2026-01-11T03:00:00.000Z"
 * console.log(range.endISO);   // "2026-01-18T02:59:59.999Z"
 * 
 * // Use in API call
 * await api.getDashboardMetrics({
 *   startDate: range.startISO,
 *   endDate: range.endISO,
 *   timezone: range.timezone,
 * });
 */

// Types
export type {
  DateRangePreset,
  DateRangeOutput,
  CustomDateRange,
  DateRangeConfig,
} from './types';

// Constants
export {
  DATE_RANGE_PRESETS,
  PRESET_LABELS,
  DEFAULT_DATE_RANGE_CONFIG,
} from './types';

// Service
export { DateRangeService, dateRangeService } from './service';
