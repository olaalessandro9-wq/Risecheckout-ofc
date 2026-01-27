/**
 * Token Exchange Handler
 * 
 * Responsabilidade: Trocar authorization code por access_token
 * Usa mercadopago-oauth-config.ts como SSOT para garantir consistência
 * 
 * @module mercadopago-oauth-callback/handlers/token-exchange
 * @version 2.0.0 - RISE Protocol V3 SSOT Architecture
 */

import { createLogger } from "../../_shared/logger.ts";
import { 
  getTokenExchangeConfig, 
  getDebugInfo,
  MERCADOPAGO_REDIRECT_URI 
} from "../../_shared/mercadopago-oauth-config.ts";

const log = createLogger("mercadopago-oauth-callback");

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  public_key: string;
  user_id: number;
}

export interface TokenExchangeResult {
  success: boolean;
  data?: TokenResponse;
  error?: string;
  reason?: string;
}

/**
 * Troca o authorization code por tokens de acesso
 * 
 * SSOT: Usa mercadopago-oauth-config.ts para garantir que o redirect_uri
 * seja idêntico ao usado na autorização inicial
 */
export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
  log.info('Iniciando troca de code por access_token...');
  
  // Log debug info (sem expor secrets)
  const debugInfo = getDebugInfo();
  log.info(`Client ID: ${debugInfo.client_id}`);
  log.info(`Redirect URI: ${debugInfo.redirect_uri}`);
  log.info(`Client Secret configurado: ${debugInfo.client_secret_configured}`);

  // Obter configuração completa do SSOT
  const config = getTokenExchangeConfig({ code });
  
  if (!config) {
    log.error('MERCADOPAGO_CLIENT_SECRET não está configurado no Supabase Secrets');
    return {
      success: false,
      error: 'Configuração incompleta do Mercado Pago.',
      reason: 'missing_client_secret',
    };
  }

  try {
    const tokenResponse = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: config.body,
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      log.error(`Erro ao trocar code: ${tokenResponse.status} ${errorData}`);
      
      // Parse para identificar tipo de erro
      let reason = 'token_exchange_failed';
      try {
        const errorJson = JSON.parse(errorData);
        if (errorJson.error === 'invalid_grant') {
          reason = 'invalid_grant';
        } else if (errorJson.message?.includes('redirect_uri')) {
          reason = 'redirect_uri_mismatch';
        }
      } catch {
        // Manter reason padrão
      }
      
      return {
        success: false,
        error: 'Erro ao obter token do Mercado Pago.',
        reason,
      };
    }

    const tokenData = await tokenResponse.json() as TokenResponse;
    log.info(`Token obtido. User ID: ${tokenData.user_id}`);

    if (!tokenData.user_id || typeof tokenData.user_id !== 'number') {
      log.error(`user_id inválido: ${tokenData.user_id}`);
      return {
        success: false,
        error: 'Dados inválidos retornados pelo Mercado Pago.',
        reason: 'invalid_user_id',
      };
    }

    return {
      success: true,
      data: tokenData,
    };

  } catch (error) {
    log.error('Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      reason: 'network_error',
    };
  }
}
