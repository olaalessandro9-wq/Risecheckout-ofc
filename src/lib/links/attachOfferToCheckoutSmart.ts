import { supabase } from "@/integrations/supabase/client";
import type { AttachOfferToCheckoutSmartResult } from "@/integrations/supabase/types-extended";

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
  const { data, error } = await (supabase.rpc as any)("attach_offer_to_checkout_smart", {
    p_checkout_id: checkoutId,
    p_offer_id: offerId,
  });

  if (error) {
    console.error("[attachOfferToCheckoutSmart] RPC failed:", error);
    throw error;
  }

  if (!data) {
    throw new Error("RPC não retornou dados");
  }

  return data as AttachOfferResult;
}
