/**
 * Timezone Types
 * 
 * @module lib/timezone
 * @version RISE V3 Compliant - Solution C (10.0 score)
 * 
 * Type definitions for the centralized timezone architecture.
 */

/** 
 * IANA Timezone identifier
 * 
 * @see https://en.wikipedia.org/wiki/List_of_tz_database_time_zones
 */
export type IANATimezone = 
  | 'America/Sao_Paulo'
  | 'America/New_York'
  | 'America/Los_Angeles'
  | 'America/Chicago'
  | 'America/Denver'
  | 'America/Manaus'
  | 'America/Fortaleza'
  | 'America/Recife'
  | 'America/Cuiaba'
  | 'America/Porto_Velho'
  | 'America/Boa_Vista'
  | 'America/Rio_Branco'
  | 'Europe/London'
  | 'Europe/Paris'
  | 'Europe/Berlin'
  | 'Europe/Lisbon'
  | 'Europe/Madrid'
  | 'Asia/Tokyo'
  | 'Asia/Shanghai'
  | 'Asia/Dubai'
  | 'Australia/Sydney'
  | 'Pacific/Auckland'
  | 'UTC';

/**
 * Configuration for timezone service
 */
export interface TimezoneConfig {
  readonly timezone: IANATimezone;
  readonly locale: string;
}

/**
 * Date boundaries in ISO format for database queries
 */
export interface DateBoundaries {
  readonly startOfDay: string;
  readonly endOfDay: string;
}

/**
 * Formatted date/time output
 */
export interface FormattedDateTime {
  readonly date: string;
  readonly time: string;
  readonly full: string;
  readonly relative: string;
}

/**
 * Timezone info for UI display
 */
export interface TimezoneOption {
  readonly value: IANATimezone;
  readonly label: string;
  readonly offset: string;
}
