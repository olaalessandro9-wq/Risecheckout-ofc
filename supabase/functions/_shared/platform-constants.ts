/**
 * platform-constants.ts
 * 
 * Constantes globais da plataforma RiseCheckout.
 * Extraído de platform-config.ts para RISE ARCHITECT PROTOCOL V3 (< 300 linhas).
 * 
 * @module _shared/platform-constants
 * @version 1.0.0
 */

// ========================================================================
// TAXA DA PLATAFORMA
// ========================================================================

/**
 * Taxa da plataforma em decimal (4% = 0.04)
 * 
 * REGRAS DE APLICAÇÃO:
 * - Owner vendendo DIRETO: NÃO APLICA (taxa = 0)
 * - Owner vendendo COM AFILIADO: APLICA (para cálculo do split)
 * - Vendedor comum: SEMPRE APLICA
 */
export const PLATFORM_FEE_PERCENT = 0.04; // 4%

// ========================================================================
// OWNER DA PLATAFORMA
// ========================================================================

/**
 * User ID do Owner da plataforma
 * 
 * O OWNER é especial porque:
 * 1. É ISENTO de taxa quando vende DIRETAMENTE (sem afiliado)
 * 2. Quando vende COM AFILIADO, a taxa é calculada mas retorna ao Owner
 * 3. É o ÚNICO que pode ter programa de afiliados
 * 4. Recebe a taxa de 4% de todos os outros vendedores
 */
export const PLATFORM_OWNER_USER_ID = "ccff612c-93e6-4acc-85d9-7c9d978a7e4e";

// ========================================================================
// IDs DE GATEWAYS DA PLATAFORMA
// ========================================================================

/**
 * Collector ID da conta Mercado Pago da RiseCheckout
 */
export const PLATFORM_MERCADOPAGO_COLLECTOR_ID = "3002802852";

/**
 * Account ID da conta PushinPay da RiseCheckout
 * ⚠️ LIDO EXCLUSIVAMENTE DO SECRET
 */
export const PLATFORM_PUSHINPAY_ACCOUNT_ID = Deno.env.get('PUSHINPAY_PLATFORM_ACCOUNT_ID') || '';

/**
 * Account ID da conta Stripe da plataforma (se houver)
 */
export const PLATFORM_STRIPE_ACCOUNT_ID = "";

// ========================================================================
// MAPA DE SECRETS POR GATEWAY
// ========================================================================

/**
 * Mapa de secrets globais por gateway
 * Usados APENAS pelo Owner (Checkout) - vendedores usam vendor_integrations
 */
export const OWNER_GATEWAY_SECRETS = {
  asaas: {
    apiKey: 'ASAAS_API_KEY',
    walletId: 'ASAAS_PLATFORM_WALLET_ID',
  },
  mercadopago: {
    accessToken: 'MERCADOPAGO_ACCESS_TOKEN',
    collectorId: 'MERCADOPAGO_COLLECTOR_ID',
  },
  pushinpay: {
    token: 'PUSHINPAY_API_TOKEN',
    accountId: 'PUSHINPAY_PLATFORM_ACCOUNT_ID',
  },
  stripe: {
    secretKey: 'STRIPE_SECRET_KEY',
  }
} as const;

export type GatewayType = keyof typeof OWNER_GATEWAY_SECRETS;

/**
 * Mapeamento de GatewayType para tipo de integração
 */
export const INTEGRATION_TYPE_MAP: Record<GatewayType, string> = {
  asaas: 'ASAAS',
  mercadopago: 'MERCADOPAGO',
  pushinpay: 'PUSHINPAY',
  stripe: 'STRIPE'
};
