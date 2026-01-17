/**
 * Vendor Timezone Hook
 * 
 * @module hooks
 * @version RISE V3 Compliant - Solution C (10.0 score)
 * 
 * Provides the vendor's configured timezone and a pre-configured TimezoneService.
 * Falls back to America/Sao_Paulo if no timezone is configured.
 * 
 * @example
 * function DashboardPage() {
 *   const { timezone, service } = useVendorTimezone();
 *   
 *   // Use service for date operations
 *   const { startOfDay, endOfDay } = service.getDateBoundaries(selectedDate);
 *   const formattedDate = service.format(order.created_at);
 * }
 */

import { useMemo } from 'react';
import { useProducerSession } from './useProducerSession';
import { 
  TimezoneService, 
  DEFAULT_TIMEZONE,
  type IANATimezone,
} from '@/lib/timezone';

interface UseVendorTimezoneReturn {
  /** The vendor's configured timezone */
  timezone: IANATimezone;
  /** Pre-configured TimezoneService instance */
  service: TimezoneService;
  /** Whether the timezone is the default (not explicitly configured) */
  isDefaultTimezone: boolean;
}

/**
 * Hook to get vendor's configured timezone and service
 * 
 * Uses the producer session to get the vendor's timezone preference.
 * Falls back to DEFAULT_TIMEZONE (America/Sao_Paulo) if not set.
 */
export function useVendorTimezone(): UseVendorTimezoneReturn {
  const { producer } = useProducerSession();
  
  // Get timezone from vendor profile, fallback to default
  // Cast to access the timezone property added via migration
  const producerWithTz = producer as { timezone?: string } | null;
  const timezone = (producerWithTz?.timezone as IANATimezone) || DEFAULT_TIMEZONE;
  const isDefaultTimezone = !producerWithTz?.timezone;
  
  // Memoize the service to avoid recreating on every render
  const service = useMemo(
    () => new TimezoneService({ timezone }),
    [timezone]
  );
  
  return { 
    timezone, 
    service,
    isDefaultTimezone,
  };
}
