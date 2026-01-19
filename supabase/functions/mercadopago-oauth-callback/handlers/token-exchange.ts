/**
 * Token Exchange Handler
 * 
 * Responsabilidade: Trocar authorization code por access_token
 * 
 * @module mercadopago-oauth-callback/handlers/token-exchange
 */

import { createLogger } from "../../_shared/logger.ts";

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
}

const MERCADOPAGO_CLIENT_ID = Deno.env.get('MERCADOPAGO_CLIENT_ID') || '2354396684039370';
const MERCADOPAGO_CLIENT_SECRET = Deno.env.get('MERCADOPAGO_CLIENT_SECRET') || '';
const MERCADOPAGO_REDIRECT_URI = Deno.env.get('MERCADOPAGO_REDIRECT_URI') || '';

/**
 * Troca o authorization code por tokens de acesso
 */
export async function exchangeCodeForToken(code: string): Promise<TokenExchangeResult> {
  log.info('Iniciando troca de code por access_token...');
  log.info(`Client ID: ${MERCADOPAGO_CLIENT_ID}`);
  log.info(`Redirect URI: ${MERCADOPAGO_REDIRECT_URI}`);
  log.info(`Client Secret presente: ${!!MERCADOPAGO_CLIENT_SECRET}`);

  try {
    const tokenResponse = await fetch('https://api.mercadopago.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: MERCADOPAGO_CLIENT_ID,
        client_secret: MERCADOPAGO_CLIENT_SECRET,
        code: code,
        redirect_uri: MERCADOPAGO_REDIRECT_URI
      })
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      log.error(`Erro ao trocar code: ${tokenResponse.status} ${errorData}`);
      return {
        success: false,
        error: 'Erro ao obter token do Mercado Pago.'
      };
    }

    const tokenData = await tokenResponse.json() as TokenResponse;
    log.info(`Token obtido. User ID: ${tokenData.user_id}`);

    if (!tokenData.user_id || typeof tokenData.user_id !== 'number') {
      log.error(`user_id inválido: ${tokenData.user_id}`);
      return {
        success: false,
        error: 'Dados inválidos retornados pelo Mercado Pago.'
      };
    }

    return {
      success: true,
      data: tokenData
    };

  } catch (error) {
    log.error('Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
