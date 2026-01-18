/**
 * User Info Fetcher Handler
 * 
 * Responsabilidade: Buscar informações do usuário na API do Mercado Pago
 * 
 * @module mercadopago-oauth-callback/handlers/user-info-fetcher
 */

import { maskEmail } from "../../_shared/kernel/security/pii-masking.ts";

export interface UserInfoResponse {
  email: string;
}

export interface UserInfoResult {
  email: string | null;
}

/**
 * Busca informações do usuário no Mercado Pago (email, etc)
 */
export async function fetchMercadoPagoUserInfo(
  userId: number,
  accessToken: string
): Promise<UserInfoResult> {
  console.log('[User Info Fetcher] Buscando informações do usuário MP...');

  try {
    const userInfoResponse = await fetch(`https://api.mercadopago.com/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      console.warn('[User Info Fetcher] Não foi possível buscar email do MP');
      return { email: null };
    }

    const userInfo = await userInfoResponse.json() as UserInfoResponse;
    const email = userInfo.email || null;
    
    console.log('[User Info Fetcher] Email MP:', maskEmail(email || ''));
    
    return { email };

  } catch (error) {
    console.warn('[User Info Fetcher] Erro ao buscar info:', error);
    return { email: null };
  }
}
