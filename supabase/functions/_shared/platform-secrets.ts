/**
 * platform-secrets.ts
 * 
 * Catálogo centralizado de todos os secrets do projeto e funções de validação.
 * Extraído de platform-config.ts para RISE ARCHITECT PROTOCOL V3 (< 300 linhas).
 * 
 * @module _shared/platform-secrets
 * @version 1.0.0
 */

// ========================================================================
// INTERFACES
// ========================================================================

/**
 * Definição de um secret no sistema
 */
export interface SecretDefinition {
  name: string;
  description: string;
  required: boolean;
  gateway?: 'asaas' | 'mercadopago' | 'pushinpay' | 'stripe';
}

/**
 * Resultado da validação de secrets de um gateway
 */
export interface GatewaySecretsValidation {
  valid: boolean;
  missing: string[];
}

/**
 * Status de saúde de um secret (sem expor valores)
 */
export interface SecretHealthStatus {
  configured: boolean;
  gateway?: string;
}

// ========================================================================
// CATÁLOGO DE SECRETS
// ========================================================================

/**
 * Manifest completo de todos os secrets do projeto
 * 
 * Este catálogo serve como documentação e fonte da verdade para
 * todos os secrets que devem estar configurados no Supabase.
 */
export const SECRETS_MANIFEST: Record<string, SecretDefinition> = {
  // ========================================================================
  // ASAAS
  // ========================================================================
  ASAAS_API_KEY: {
    name: 'ASAAS_API_KEY',
    description: 'API Key da conta Asaas da plataforma (Owner)',
    required: true,
    gateway: 'asaas',
  },
  ASAAS_PLATFORM_WALLET_ID: {
    name: 'ASAAS_PLATFORM_WALLET_ID',
    description: 'Wallet ID da conta Asaas para split de pagamentos',
    required: false,
    gateway: 'asaas',
  },

  // ========================================================================
  // MERCADO PAGO
  // ========================================================================
  MERCADOPAGO_ACCESS_TOKEN: {
    name: 'MERCADOPAGO_ACCESS_TOKEN',
    description: 'Access Token da conta Mercado Pago da plataforma (Owner)',
    required: true,
    gateway: 'mercadopago',
  },
  MERCADOPAGO_COLLECTOR_ID: {
    name: 'MERCADOPAGO_COLLECTOR_ID',
    description: 'Collector ID da conta Mercado Pago para split',
    required: false,
    gateway: 'mercadopago',
  },

  // ========================================================================
  // PUSHINPAY
  // ========================================================================
  PUSHINPAY_API_TOKEN: {
    name: 'PUSHINPAY_API_TOKEN',
    description: 'API Token da conta PushinPay da plataforma (Owner)',
    required: true,
    gateway: 'pushinpay',
  },
  PUSHINPAY_PLATFORM_ACCOUNT_ID: {
    name: 'PUSHINPAY_PLATFORM_ACCOUNT_ID',
    description: 'Account ID da conta PushinPay para split',
    required: false,
    gateway: 'pushinpay',
  },

  // ========================================================================
  // STRIPE
  // ========================================================================
  STRIPE_SECRET_KEY: {
    name: 'STRIPE_SECRET_KEY',
    description: 'Secret Key da conta Stripe da plataforma (Owner)',
    required: true,
    gateway: 'stripe',
  },

  // ========================================================================
  // PLATAFORMA (GLOBAIS)
  // ========================================================================
  ENCRYPTION_KEY: {
    name: 'ENCRYPTION_KEY',
    description: 'Chave de criptografia para dados sensíveis (AES-256)',
    required: true,
  },
  RESEND_API_KEY: {
    name: 'RESEND_API_KEY',
    description: 'API Key do Resend para envio de emails',
    required: false,
  },
  ZEPTOMAIL_API_KEY: {
    name: 'ZEPTOMAIL_API_KEY',
    description: 'API Key do ZeptoMail para envio de emails transacionais',
    required: false,
  },
};

// ========================================================================
// FUNÇÕES DE VALIDAÇÃO
// ========================================================================

/**
 * Valida se os secrets de um gateway específico estão configurados
 * 
 * @param gateway - Gateway a validar ('asaas', 'mercadopago', 'pushinpay', 'stripe')
 * @returns Objeto com status de validação e lista de secrets faltantes
 * 
 * @example
 * ```typescript
 * const result = validateGatewaySecrets('asaas');
 * if (!result.valid) {
 *   console.error('Secrets faltantes:', result.missing);
 * }
 * ```
 */
export function validateGatewaySecrets(
  gateway: 'asaas' | 'mercadopago' | 'pushinpay' | 'stripe'
): GatewaySecretsValidation {
  const missing: string[] = [];

  // Filtrar secrets do gateway específico
  const gatewaySecrets = Object.values(SECRETS_MANIFEST).filter(
    (secret) => secret.gateway === gateway && secret.required
  );

  // Verificar se cada secret obrigatório está configurado
  for (const secret of gatewaySecrets) {
    const value = Deno.env.get(secret.name);
    if (!value || value.trim() === '') {
      missing.push(secret.name);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Retorna status de saúde de todos os secrets (sem expor valores)
 * 
 * @returns Objeto com status de cada secret (configurado ou não)
 * 
 * @example
 * ```typescript
 * const health = getSecretsHealthCheck();
 * console.log('ASAAS_API_KEY configurado:', health.ASAAS_API_KEY.configured);
 * ```
 */
export function getSecretsHealthCheck(): Record<string, SecretHealthStatus> {
  const health: Record<string, SecretHealthStatus> = {};

  for (const [key, definition] of Object.entries(SECRETS_MANIFEST)) {
    const value = Deno.env.get(definition.name);
    health[key] = {
      configured: !!value && value.trim() !== '',
      gateway: definition.gateway,
    };
  }

  return health;
}
