/**
 * Mercado Pago OAuth Configuration - SINGLE SOURCE OF TRUTH
 * 
 * Este módulo centraliza TODA a configuração OAuth do Mercado Pago.
 * Frontend e backend DEVEM usar este módulo para garantir consistência.
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * @module _shared/mercadopago-oauth-config
 * @version 1.0.0
 */

// ============================================================================
// CONSTANTES IMUTÁVEIS (SSOT)
// ============================================================================

/**
 * Client ID público do Mercado Pago (não é secret)
 * Pode ser hardcoded pois é informação pública
 */
export const MERCADOPAGO_CLIENT_ID = '2354396684039370';

/**
 * Redirect URI ÚNICO usado em TODO o fluxo OAuth
 * 
 * CRÍTICO: Este valor DEVE ser idêntico em:
 * 1. Painel do Mercado Pago (Developers → Redirect URL)
 * 2. Autorização (buildAuthorizationUrl)
 * 3. Token Exchange (getTokenExchangeParams)
 * 
 * Usar API Gateway domain para consistência com arquitetura multi-subdomain
 */
export const MERCADOPAGO_REDIRECT_URI = 
  'https://api.risecheckout.com/functions/v1/mercadopago-oauth-callback';

/**
 * Base URL do OAuth do Mercado Pago Brasil
 */
const MERCADOPAGO_AUTH_BASE_URL = 'https://auth.mercadopago.com.br/authorization';

/**
 * URL para token exchange
 */
const MERCADOPAGO_TOKEN_URL = 'https://api.mercadopago.com/oauth/token';

// ============================================================================
// INTERFACES
// ============================================================================

export interface AuthorizationUrlParams {
  state: string;
}

export interface TokenExchangeParams {
  code: string;
}

export interface TokenExchangeConfig {
  url: string;
  method: 'POST';
  headers: Record<string, string>;
  body: URLSearchParams;
}

// ============================================================================
// FUNÇÕES PÚBLICAS
// ============================================================================

/**
 * Constrói a URL de autorização OAuth do Mercado Pago
 * 
 * Esta é a URL que será aberta no popup para o usuário autorizar
 * 
 * @param params - Parâmetros necessários (state obrigatório para CSRF)
 * @returns URL completa pronta para window.open()
 * 
 * @example
 * ```typescript
 * const url = buildAuthorizationUrl({ state: 'abc123' });
 * window.open(url, 'MercadoPago OAuth', 'width=600,height=700');
 * ```
 */
export function buildAuthorizationUrl(params: AuthorizationUrlParams): string {
  const url = new URL(MERCADOPAGO_AUTH_BASE_URL);
  
  url.searchParams.set('client_id', MERCADOPAGO_CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('platform_id', 'mp');
  url.searchParams.set('state', params.state);
  url.searchParams.set('redirect_uri', MERCADOPAGO_REDIRECT_URI);
  
  return url.toString();
}

/**
 * Obtém a configuração completa para token exchange
 * 
 * SEGURANÇA: O client_secret é obtido de variável de ambiente
 * e NUNCA deve ser hardcoded ou exposto
 * 
 * @param params - Código de autorização recebido do callback
 * @returns Configuração completa para fetch() ou null se secret não configurado
 * 
 * @example
 * ```typescript
 * const config = getTokenExchangeConfig({ code: 'auth_code_here' });
 * if (!config) throw new Error('MERCADOPAGO_CLIENT_SECRET não configurado');
 * 
 * const response = await fetch(config.url, {
 *   method: config.method,
 *   headers: config.headers,
 *   body: config.body
 * });
 * ```
 */
export function getTokenExchangeConfig(params: TokenExchangeParams): TokenExchangeConfig | null {
  const clientSecret = Deno.env.get('MERCADOPAGO_CLIENT_SECRET');
  
  if (!clientSecret || clientSecret.trim() === '') {
    return null;
  }
  
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: MERCADOPAGO_CLIENT_ID,
    client_secret: clientSecret,
    code: params.code,
    redirect_uri: MERCADOPAGO_REDIRECT_URI,
  });
  
  return {
    url: MERCADOPAGO_TOKEN_URL,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
    },
    body,
  };
}

/**
 * Valida se os secrets necessários estão configurados
 * 
 * @returns Objeto com status de validação
 */
export function validateOAuthSecrets(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];
  
  const clientSecret = Deno.env.get('MERCADOPAGO_CLIENT_SECRET');
  if (!clientSecret || clientSecret.trim() === '') {
    missing.push('MERCADOPAGO_CLIENT_SECRET');
  }
  
  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Retorna informações de configuração para debug (sem expor secrets)
 */
export function getDebugInfo(): Record<string, string | boolean> {
  return {
    client_id: MERCADOPAGO_CLIENT_ID,
    redirect_uri: MERCADOPAGO_REDIRECT_URI,
    client_secret_configured: !!Deno.env.get('MERCADOPAGO_CLIENT_SECRET'),
  };
}
