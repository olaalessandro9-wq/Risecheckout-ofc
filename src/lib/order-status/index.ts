/**
 * Order Status Module - Barrel Export
 * 
 * @module lib/order-status
 * @version RISE V3 Compliant - Solution C (9.9 score)
 * 
 * Single Source of Truth for all order status operations.
 * 
 * @example
 * import { orderStatusService, CanonicalOrderStatus } from '@/lib/order-status';
 * 
 * // Get display label
 * const label = orderStatusService.getDisplayLabel('paid'); // "Pago"
 * 
 * // Get color scheme for badge
 * const colors = orderStatusService.getColorScheme('pending');
 * 
 * // Normalize gateway status
 * const canonical = orderStatusService.normalize('approved'); // 'paid'
 * 
 * // Check status type
 * if (orderStatusService.isPaid(order.status)) { ... }
 */

// Types
export type {
  CanonicalOrderStatus,
  StatusDisplayLabel,
  StatusColorScheme,
  StatusCategory,
} from './types';

// Constants
export {
  CANONICAL_STATUSES,
  STATUS_DISPLAY_MAP,
  STATUS_COLORS,
  STATUS_CATEGORIES,
  CANONICAL_STATUS_SET,
  isCanonicalStatus,
} from './types';

// Service
export { orderStatusService } from './service';
