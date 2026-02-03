/**
 * Order Status Domain - Canonical Types
 * 
 * @module lib/order-status
 * @version RISE V3 Compliant - Modelo Hotmart/Kiwify
 * 
 * This is the SINGLE SOURCE OF TRUTH for order status definitions.
 * All status handling in the application MUST use these types.
 * 
 * PADRÃO DE MERCADO: Uma venda pendente NUNCA vira "cancelada".
 * Fica pendente eternamente ou vira paga. Igual Hotmart, Kiwify, Braip.
 */

// ============================================================================
// CANONICAL STATUS (DATABASE VALUES)
// ============================================================================

/**
 * Canonical order statuses stored in the database
 * 
 * MODELO DE MERCADO (Hotmart/Kiwify/Cakto):
 * - paid: Pagamento confirmado
 * - pending: Aguardando pagamento (PIX gerado, boleto emitido)
 * - refused: Cartão recusado (CVV inválido, limite, etc)
 * - refunded: Reembolso efetuado
 * - chargeback: Contestação no cartão
 * 
 * NOTA: 'cancelled' foi REMOVIDO (PIX expirado → pending).
 * 'failed/rejected' agora mapeia para 'refused' (cartão recusado).
 * O campo 'technical_status' guarda o status técnico real para relatórios.
 */
export const CANONICAL_STATUSES = [
  'paid',
  'pending',
  'refused',      // Cartão recusado (CVV inválido, limite, etc)
  'refunded',
  'chargeback',
] as const;

export type CanonicalOrderStatus = typeof CANONICAL_STATUSES[number];

// ============================================================================
// TECHNICAL STATUS (INTERNAL TRACKING)
// ============================================================================

/**
 * Technical statuses for internal tracking
 * 
 * Estes valores são salvos no campo 'technical_status' da tabela orders.
 * Usados para relatórios de recuperação de vendas e diagnóstico.
 */
export const TECHNICAL_STATUSES = [
  'active',           // Venda ativa, aguardando pagamento
  'expired',          // PIX/Boleto expirou
  'gateway_cancelled', // Gateway cancelou a transação
  'gateway_timeout',  // Timeout do gateway
  'gateway_error',    // Erro no gateway
  'abandoned',        // Usuário abandonou checkout
] as const;

export type TechnicalOrderStatus = typeof TECHNICAL_STATUSES[number];

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
  refused: 'Recusado',
  refunded: 'Reembolso',
  chargeback: 'Chargeback',
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
  refused: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-500',
    border: 'border-orange-500/20',
    dot: 'bg-orange-500',
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
  /** Payments awaiting confirmation (PIX aguardando) */
  pending: ['pending'] as const,
  /** Card payments that were refused */
  refused: ['refused'] as const,
  /** Payments that were reversed */
  reversed: ['refunded', 'chargeback'] as const,
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
