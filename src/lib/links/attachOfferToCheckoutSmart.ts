/**
 * Associa uma oferta a um checkout de forma inteligente via RPC Proxy
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 */

import { invokeRpc } from "@/lib/rpc/rpcProxy";
import type { AttachOfferToCheckoutSmartResult } from "@/integrations/supabase/types-extended";
import { createLogger } from "@/lib/logger";

const log = createLogger("AttachOfferToCheckoutSmart");

export type AttachOfferResult = AttachOfferToCheckoutSmartResult;

/**
 * Associa uma oferta a um checkout de forma inteligente:
 * - Se a oferta tiver um link livre, reutiliza-o
 * - Se todos os links da oferta estiverem em uso, cria um novo link com slug único
 * - Garante que cada link pertence a no máximo 1 checkout
 */
export async function attachOfferToCheckoutSmart(
  checkoutId: string,
  offerId: string
): Promise<AttachOfferResult> {
  const { data, error } = await invokeRpc<AttachOfferResult>(
    "attach_offer_to_checkout_smart",
    { p_checkout_id: checkoutId, p_offer_id: offerId },
    "producer"
  );

  if (error) {
    log.error("RPC failed:", error);
    throw error;
  }

  if (!data) {
    throw new Error("RPC não retornou dados");
  }

  return data;
}
