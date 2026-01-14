/**
 * Helper: fetchAffiliateInfo
 * 
 * Busca informações do afiliado via RPC Proxy
 * 
 * @see RISE Protocol V2 - Zero direct RPC calls from frontend
 */

import { getAffiliateCheckoutInfoRpc } from "@/lib/rpc/rpcProxy";

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

  console.log('[fetchAffiliateInfo] Buscando info para:', affiliateCode);

  const { data, error } = await getAffiliateCheckoutInfoRpc(affiliateCode, productId);

  if (error) {
    console.warn('[fetchAffiliateInfo] Erro:', error.message);
    return defaultInfo;
  }

  if (data && data.length > 0) {
    const info = data[0];
    console.log('[fetchAffiliateInfo] ✅ Info encontrada:', {
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
