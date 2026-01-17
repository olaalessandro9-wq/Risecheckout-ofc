/**
 * Order Status Domain - Canonical Types
 * 
 * @module lib/order-status
 * @version RISE V3 Compliant - Solution C (9.9 score)
 * 
 * This is the SINGLE SOURCE OF TRUTH for order status definitions.
 * All status handling in the application MUST use these types.
 * 
 * NEVER add status strings directly in components or services.
 */

// ============================================================================
// CANONICAL STATUS (DATABASE VALUES)
// ============================================================================

/**
 * Canonical order statuses stored in the database
 * 
 * These are the ONLY valid values for orders.status column.
 * A database CHECK constraint enforces this at the DB level.
 */
export const CANONICAL_STATUSES = [
  'paid',
  'pending',
  'cancelled',
  'refunded',
  'chargeback',
  'failed',
] as const;

export type CanonicalOrderStatus = typeof CANONICAL_STATUSES[number];

// ============================================================================
// STATUS DISPLAY (UI VALUES)
// ============================================================================

/**
 * Display labels for each canonical status
 * Used in UI to show user-friendly text
 */
export const STATUS_DISPLAY_MAP: Readonly<Record<CanonicalOrderStatus, string>> = {
  paid: 'Pago',
  pending: 'Pendente',
  cancelled: 'Cancelado',
  refunded: 'Reembolso',
  chargeback: 'Chargeback',
  failed: 'Falhou',
} as const;

export type StatusDisplayLabel = typeof STATUS_DISPLAY_MAP[CanonicalOrderStatus];

// ============================================================================
// STATUS COLORS (SEMANTIC)
// ============================================================================

/**
 * Color scheme for each status (Tailwind semantic classes)
 * 
 * Uses design system tokens from index.css
 */
export interface StatusColorScheme {
  readonly bg: string;
  readonly text: string;
  readonly border: string;
  readonly dot: string;
}

export const STATUS_COLORS: Readonly<Record<CanonicalOrderStatus, StatusColorScheme>> = {
  paid: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    dot: 'bg-emerald-500',
  },
  pending: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    dot: 'bg-amber-500',
  },
  cancelled: {
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-muted',
    dot: 'bg-muted-foreground',
  },
  refunded: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    dot: 'bg-blue-500',
  },
  chargeback: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
  },
  failed: {
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/20',
    dot: 'bg-red-500',
  },
} as const;

// ============================================================================
// STATUS CATEGORIES (GROUPINGS)
// ============================================================================

/**
 * Status categories for filtering and reporting
 */
export const STATUS_CATEGORIES = {
  /** Successfully completed payments */
  success: ['paid'] as const,
  /** Payments awaiting confirmation */
  pending: ['pending'] as const,
  /** Payments that were reversed */
  reversed: ['refunded', 'chargeback'] as const,
  /** Payments that did not complete */
  failed: ['cancelled', 'failed'] as const,
} as const;

export type StatusCategory = keyof typeof STATUS_CATEGORIES;

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Type guard to check if a string is a valid canonical status
 */
export function isCanonicalStatus(status: unknown): status is CanonicalOrderStatus {
  return typeof status === 'string' && 
    CANONICAL_STATUSES.includes(status as CanonicalOrderStatus);
}

/**
 * Status set for O(1) lookup
 */
export const CANONICAL_STATUS_SET = new Set<string>(CANONICAL_STATUSES);
