/**
 * Stripe OAuth Configuration - SINGLE SOURCE OF TRUTH
 * 
 * Este módulo centraliza TODA a configuração OAuth do Stripe Connect.
 * Frontend e backend DEVEM usar este módulo para garantir consistência.
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * @module _shared/stripe-oauth-config
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTES IMUTÁVEIS (SSOT)
// ============================================================================

/**
 * Redirect URI ÚNICO usado em TODO o fluxo OAuth
 * 
 * CRÍTICO: Este valor DEVE ser idêntico em:
 * 1. Painel do Stripe Dashboard (Connect → Settings → Redirect URIs)
 * 2. Autorização (buildStripeAuthorizationUrl)
 * 3. Token Exchange
 * 
 * Usar API Gateway domain para consistência com arquitetura multi-subdomain
 */
export const STRIPE_REDIRECT_URI = 
  'https://api.risecheckout.com/functions/v1/stripe-connect-oauth?action=callback';

/**
 * Base URL do OAuth do Stripe Connect
 */
const STRIPE_AUTH_BASE_URL = 'https://connect.stripe.com/oauth/authorize';

// ============================================================================
// INTERFACES
// ============================================================================

export interface StripeAuthorizationParams {
  state: string;
}

export interface StripeDebugInfo {
  client_id: string;
  redirect_uri: string;
  client_secret_configured: boolean;
}

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

/**
 * Obtém o Client ID do Stripe Connect
 * 
 * O Client ID é lido de variável de ambiente pois é específico da aplicação
 * (diferente do Mercado Pago que usa valor público fixo)
 * 
 * @returns Client ID ou string vazia se não configurado
 */
export function getStripeClientId(): string {
  return Deno.env.get('STRIPE_CLIENT_ID') || '';
}

/**
 * Constrói a URL de autorização OAuth do Stripe Connect
 * 
 * Esta é a URL que será aberta no popup para o usuário autorizar
 * 
 * @param params - Parâmetros necessários (state obrigatório para CSRF)
 * @returns URL completa pronta para window.open() ou null se client_id não configurado
 * 
 * @example
 * ```typescript
 * const url = buildStripeAuthorizationUrl({ state: 'abc123' });
 * if (url) {
 *   window.open(url, 'Stripe OAuth', 'width=600,height=700');
 * }
 * ```
 */
export function buildStripeAuthorizationUrl(params: StripeAuthorizationParams): string | null {
  const clientId = getStripeClientId();
  
  if (!clientId || clientId.trim() === '') {
    return null;
  }
  
  const url = new URL(STRIPE_AUTH_BASE_URL);
  
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('client_id', clientId);
  url.searchParams.set('scope', 'read_write');
  url.searchParams.set('redirect_uri', STRIPE_REDIRECT_URI);
  url.searchParams.set('state', params.state);
  url.searchParams.set('stripe_user[country]', 'BR');
  
  return url.toString();
}

/**
 * Valida se os secrets necessários estão configurados
 * 
 * @returns Objeto com status de validação
 */
export function validateStripeOAuthSecrets(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  const clientId = getStripeClientId();
  if (!clientId || clientId.trim() === '') {
    missing.push('STRIPE_CLIENT_ID');
  }
  
  const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
  if (!secretKey || secretKey.trim() === '') {
    missing.push('STRIPE_SECRET_KEY');
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Retorna informações de configuração para debug (sem expor secrets)
 */
export function getStripeDebugInfo(): StripeDebugInfo {
  const clientId = getStripeClientId();
  return {
    client_id: clientId ? `${clientId.substring(0, 10)}...` : '(not configured)',
    redirect_uri: STRIPE_REDIRECT_URI,
    client_secret_configured: !!Deno.env.get('STRIPE_SECRET_KEY'),
  };
}
