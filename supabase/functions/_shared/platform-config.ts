/**
 * ============================================================================
 * Configurações Centralizadas da Plataforma RiseCheckout
 * ============================================================================
 * 
 * Este arquivo re-exporta todos os módulos de configuração para manter
 * compatibilidade retroativa. Novos imports devem usar os módulos diretamente.
 * 
 * 📖 DOCUMENTAÇÃO: docs/MODELO_NEGOCIO.md
 * 
 * MÓDULOS:
 * - platform-constants.ts: Constantes globais (IDs, taxas)
 * - platform-secrets.ts: Manifest e validação de secrets
 * - fee-calculator.ts: Cálculos de taxas e comissões
 * - gateway-credentials.ts: Busca de credenciais por vendedor
 * 
 * ============================================================================
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10 - Arquivo refatorado de 720 → ~50 linhas
 * ============================================================================
 */

// ========================================================================
// RE-EXPORTS: platform-constants.ts
// ========================================================================

export {
  PLATFORM_FEE_PERCENT,
  PLATFORM_OWNER_USER_ID,
  PLATFORM_MERCADOPAGO_COLLECTOR_ID,
  PLATFORM_PUSHINPAY_ACCOUNT_ID,
  PLATFORM_STRIPE_ACCOUNT_ID,
  OWNER_GATEWAY_SECRETS,
  INTEGRATION_TYPE_MAP,
  type GatewayType
} from './platform-constants.ts';

// ========================================================================
// RE-EXPORTS: platform-secrets.ts
// ========================================================================

export {
  SECRETS_MANIFEST,
  validateGatewaySecrets,
  getSecretsHealthCheck
} from './platform-secrets.ts';

// ========================================================================
// RE-EXPORTS: fee-calculator.ts
// ========================================================================

export {
  calculatePlatformFeeCents,
  calculatePlatformFeeReais,
  getPlatformFeePercentFormatted,
  getVendorFeePercent,
  isVendorOwner,
  calculateAffiliateCommission
} from './fee-calculator.ts';

// ========================================================================
// RE-EXPORTS: gateway-credentials.ts
// ========================================================================

export {
  getGatewayCredentials,
  validateCredentials,
  type GatewayCredentials,
  type GatewayCredentialsResult
} from './gateway-credentials.ts';
