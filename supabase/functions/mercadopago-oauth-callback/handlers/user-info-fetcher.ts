/**
 * User Info Fetcher Handler
 * 
 * Responsabilidade: Buscar informações do usuário na API do Mercado Pago
 * 
 * @module mercadopago-oauth-callback/handlers/user-info-fetcher
 */

import { maskEmail } from "../../_shared/kernel/security/pii-masking.ts";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("mercadopago-oauth-callback");

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
  log.info('Buscando informações do usuário MP...');

  try {
    const userInfoResponse = await fetch(`https://api.mercadopago.com/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!userInfoResponse.ok) {
      log.warn('Não foi possível buscar email do MP');
      return { email: null };
    }

    const userInfo = await userInfoResponse.json() as UserInfoResponse;
    const email = userInfo.email || null;
    
    log.info(`Email MP: ${maskEmail(email || '')}`);
    
    return { email };

  } catch (error) {
    log.warn('Erro ao buscar info:', error);
    return { email: null };
  }
}
