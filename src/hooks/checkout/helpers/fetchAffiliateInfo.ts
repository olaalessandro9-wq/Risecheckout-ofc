/**
 * Helper: fetchAffiliateInfo
 * 
 * Busca informações do afiliado via RPC Proxy
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { getAffiliateCheckoutInfoRpc } from "@/lib/rpc/rpcProxy";
import { createLogger } from "@/lib/logger";

const log = createLogger('FetchAffiliateInfo');

export interface AffiliateInfo {
  pixGateway: string | null;
  creditCardGateway: string | null;
  mercadoPagoPublicKey: string | null;
  stripePublicKey: string | null;
}

/**
 * Extrai código de afiliado da URL (?ref=xxx)
 */
export function getAffiliateCode(): string | null {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('ref') || null;
}

/**
 * Busca info do afiliado via RPC Proxy
 */
export async function fetchAffiliateInfo(
  affiliateCode: string,
  productId: string
): Promise<AffiliateInfo> {
  const defaultInfo: AffiliateInfo = {
    pixGateway: null,
    creditCardGateway: null,
    mercadoPagoPublicKey: null,
    stripePublicKey: null,
  };

  if (!affiliateCode) {
    return defaultInfo;
  }

  log.debug('Buscando info para', affiliateCode);

  const { data, error } = await getAffiliateCheckoutInfoRpc(affiliateCode, productId);

  if (error) {
    log.warn('Erro ao buscar info', error.message);
    return defaultInfo;
  }

  if (data && data.length > 0) {
    const info = data[0];
    log.info('Info encontrada', {
      pix: info.pix_gateway,
      card: info.credit_card_gateway,
    });
    
    return {
      pixGateway: info.pix_gateway,
      creditCardGateway: info.credit_card_gateway,
      mercadoPagoPublicKey: info.mercadopago_public_key,
      stripePublicKey: info.stripe_public_key,
    };
  }

  return defaultInfo;
}
