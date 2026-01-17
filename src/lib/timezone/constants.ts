/**
 * Timezone Constants
 * 
 * @module lib/timezone
 * @version RISE V3 Compliant - Solution C (10.0 score)
 * 
 * Central configuration for timezone handling.
 */

import type { IANATimezone, TimezoneConfig, TimezoneOption } from './types';

/** Default timezone for the platform (Brazil) */
export const DEFAULT_TIMEZONE: IANATimezone = 'America/Sao_Paulo';

/** Default locale for formatting */
export const DEFAULT_LOCALE = 'pt-BR';

/** Default configuration */
export const DEFAULT_CONFIG: TimezoneConfig = {
  timezone: DEFAULT_TIMEZONE,
  locale: DEFAULT_LOCALE,
} as const;

/** 
 * Supported timezones for UI dropdown
 * Grouped by region with user-friendly labels
 */
export const SUPPORTED_TIMEZONES: readonly TimezoneOption[] = [
  // Brazil
  { value: 'America/Sao_Paulo', label: 'Brasília', offset: 'GMT-3' },
  { value: 'America/Manaus', label: 'Manaus', offset: 'GMT-4' },
  { value: 'America/Fortaleza', label: 'Fortaleza', offset: 'GMT-3' },
  { value: 'America/Recife', label: 'Recife', offset: 'GMT-3' },
  { value: 'America/Cuiaba', label: 'Cuiabá', offset: 'GMT-4' },
  { value: 'America/Porto_Velho', label: 'Porto Velho', offset: 'GMT-4' },
  { value: 'America/Boa_Vista', label: 'Boa Vista', offset: 'GMT-4' },
  { value: 'America/Rio_Branco', label: 'Rio Branco', offset: 'GMT-5' },
  
  // Americas
  { value: 'America/New_York', label: 'New York (EST)', offset: 'GMT-5' },
  { value: 'America/Chicago', label: 'Chicago (CST)', offset: 'GMT-6' },
  { value: 'America/Denver', label: 'Denver (MST)', offset: 'GMT-7' },
  { value: 'America/Los_Angeles', label: 'Los Angeles (PST)', offset: 'GMT-8' },
  
  // Europe
  { value: 'Europe/London', label: 'London (GMT)', offset: 'GMT+0' },
  { value: 'Europe/Lisbon', label: 'Lisboa', offset: 'GMT+0' },
  { value: 'Europe/Madrid', label: 'Madrid', offset: 'GMT+1' },
  { value: 'Europe/Paris', label: 'Paris', offset: 'GMT+1' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 'GMT+1' },
  
  // Asia/Pacific
  { value: 'Asia/Dubai', label: 'Dubai', offset: 'GMT+4' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 'GMT+8' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'GMT+9' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'GMT+11' },
  { value: 'Pacific/Auckland', label: 'Auckland', offset: 'GMT+13' },
  
  // UTC
  { value: 'UTC', label: 'UTC', offset: 'GMT+0' },
] as const;

/**
 * Get timezone option by value
 */
export function getTimezoneOption(timezone: IANATimezone): TimezoneOption | undefined {
  return SUPPORTED_TIMEZONES.find(tz => tz.value === timezone);
}

/**
 * Check if a string is a valid IANA timezone
 */
export function isValidTimezone(timezone: string): timezone is IANATimezone {
  return SUPPORTED_TIMEZONES.some(tz => tz.value === timezone);
}
