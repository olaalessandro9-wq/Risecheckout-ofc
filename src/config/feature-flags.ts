/**
 * Feature Flags - Controle de Funcionalidades
 * 
 * Este arquivo centraliza todas as feature flags do sistema.
 */

const isDevelopment = import.meta.env.DEV;

export const FEATURE_FLAGS = {
  /** Nova Arquitetura Multi-Gateway de Pagamento */
  USE_NEW_PAYMENT_ARCHITECTURE: true,

  /** Stripe Gateway (em breve) */
  ENABLE_STRIPE_GATEWAY: false,

  /** PagSeguro Gateway (em breve) */
  ENABLE_PAGSEGURO_GATEWAY: false,

  /** Validação de Credenciais */
  VALIDATE_GATEWAY_CREDENTIALS: true,

  /** Debug Mode */
  DEBUG_MODE: isDevelopment,
} as const;

export function isFeatureEnabled(flag: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[flag];
}

export function getActiveFlags(): string[] {
  return Object.entries(FEATURE_FLAGS)
    .filter(([_, value]) => value === true)
    .map(([key]) => key);
}

export function debugLog(message: string, data?: any): void {
  if (FEATURE_FLAGS.DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`, data || '');
  }
}

export type FeatureFlagKey = keyof typeof FEATURE_FLAGS;
