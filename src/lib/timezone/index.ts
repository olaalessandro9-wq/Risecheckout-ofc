/**
 * Timezone Module - Barrel Export
 * 
 * @module lib/timezone
 * @version RISE V3 Compliant - Solution C (10.0 score)
 * 
 * Single Source of Truth for all timezone operations.
 * 
 * @example
 * import { timezoneService, DEFAULT_TIMEZONE } from '@/lib/timezone';
 * 
 * // Get date boundaries for database queries
 * const { startOfDay, endOfDay } = timezoneService.getDateBoundaries(new Date());
 * 
 * // Format a date for display
 * const formatted = timezoneService.format(order.created_at);
 * 
 * // Get hour in timezone for charts
 * const hour = timezoneService.getHourInTimezone(order.created_at);
 */

// Types
export type { 
  IANATimezone, 
  TimezoneConfig, 
  DateBoundaries, 
  FormattedDateTime,
  TimezoneOption,
} from './types';

// Constants
export { 
  DEFAULT_TIMEZONE, 
  DEFAULT_LOCALE, 
  DEFAULT_CONFIG,
  SUPPORTED_TIMEZONES,
  getTimezoneOption,
  isValidTimezone,
} from './constants';

// Service
export { TimezoneService, timezoneService } from './service';
