/**
 * Token Exchange Handler
 * 
 * Responsabilidade: Trocar authorization code por access_token
 * 
 * @module mercadopago-oauth-callback/handlers/token-exchange
 */

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
  console.log('[Token Exchange] Iniciando troca de code por access_token...');
  console.log('[Token Exchange] Client ID:', MERCADOPAGO_CLIENT_ID);
  console.log('[Token Exchange] Redirect URI:', MERCADOPAGO_REDIRECT_URI);
  console.log('[Token Exchange] Client Secret presente:', !!MERCADOPAGO_CLIENT_SECRET);

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
      console.error('[Token Exchange] Erro ao trocar code:', tokenResponse.status, errorData);
      return {
        success: false,
        error: 'Erro ao obter token do Mercado Pago.'
      };
    }

    const tokenData = await tokenResponse.json() as TokenResponse;
    console.log('[Token Exchange] Token obtido. User ID:', tokenData.user_id);

    // Validar que user_id é numérico (segurança)
    if (!tokenData.user_id || typeof tokenData.user_id !== 'number') {
      console.error('[Token Exchange] user_id inválido:', tokenData.user_id);
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
    console.error('[Token Exchange] Exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    };
  }
}
