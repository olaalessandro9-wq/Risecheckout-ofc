/**
 * Date Range Types
 * 
 * @module lib/date-range
 * @version RISE V3 Compliant - Solution C (9.9 score)
 * 
 * Type definitions for the centralized date range architecture.
 * All date range calculations use São Paulo timezone as the "day" boundary.
 */

import type { IANATimezone } from '@/lib/timezone';

// ============================================================================
// PRESETS
// ============================================================================

/**
 * Available date range presets
 */
export const DATE_RANGE_PRESETS = [
  'today',
  'yesterday',
  '7days',
  '30days',
  'max',
  'custom',
] as const;

export type DateRangePreset = typeof DATE_RANGE_PRESETS[number];

/**
 * Display labels for each preset (pt-BR)
 */
export const PRESET_LABELS: Readonly<Record<DateRangePreset, string>> = {
  today: 'Hoje',
  yesterday: 'Ontem',
  '7days': 'Últimos 7 dias',
  '30days': 'Últimos 30 dias',
  max: 'Máximo',
  custom: 'Personalizado',
} as const;

// ============================================================================
// DATE RANGE OUTPUT
// ============================================================================

/**
 * Calculated date range for API queries
 * 
 * Both dates are in ISO 8601 format (UTC), but represent
 * boundaries calculated in the configured timezone.
 */
export interface DateRangeOutput {
  /** Start of range (00:00:00.000 in timezone, converted to UTC) */
  readonly startISO: string;
  /** End of range (23:59:59.999 in timezone, converted to UTC) */
  readonly endISO: string;
  /** Start as Date object */
  readonly startDate: Date;
  /** End as Date object */
  readonly endDate: Date;
  /** The timezone used for calculation */
  readonly timezone: IANATimezone;
  /** The preset that generated this range (or 'custom') */
  readonly preset: DateRangePreset;
}

/**
 * Custom date range input from calendar selection
 */
export interface CustomDateRange {
  readonly from: Date;
  readonly to: Date;
}

// ============================================================================
// SERVICE CONFIG
// ============================================================================

/**
 * Configuration for DateRangeService
 */
export interface DateRangeConfig {
  /** Timezone for day boundary calculations (default: America/Sao_Paulo) */
  readonly timezone: IANATimezone;
  /** Date to consider as "today" (default: new Date()) - useful for testing */
  readonly referenceDate?: Date;
  /** Start date for "max" preset (default: 2020-01-01) */
  readonly maxStartDate?: Date;
}

export const DEFAULT_DATE_RANGE_CONFIG: DateRangeConfig = {
  timezone: 'America/Sao_Paulo',
  maxStartDate: new Date('2020-01-01T03:00:00.000Z'), // Jan 1, 2020 00:00 SP
} as const;
