/**
 * Feature Flags - Controle de Funcionalidades
 * 
 * Este arquivo centraliza todas as feature flags do sistema.
 * 
 * RISE Protocol V3: Flags obsoletas foram removidas na auditoria de código morto.
 */

const isDevelopment = import.meta.env.DEV;

export const FEATURE_FLAGS = {
  /** Stripe Gateway (em breve) */
  ENABLE_STRIPE_GATEWAY: false,

  /** PagSeguro Gateway (em breve) */
  ENABLE_PAGSEGURO_GATEWAY: false,

  /** Validação de Credenciais */
  VALIDATE_GATEWAY_CREDENTIALS: true,

  /** Debug Mode */
  DEBUG_MODE: isDevelopment,
} as const;

export function debugLog(message: string, data?: unknown): void {
  if (FEATURE_FLAGS.DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data ?? '');
  }
}

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
