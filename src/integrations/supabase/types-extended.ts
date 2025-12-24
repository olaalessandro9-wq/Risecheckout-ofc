/**
 * Extensões de tipos para RPCs customizadas não geradas automaticamente
 * Este arquivo complementa src/integrations/supabase/types.ts (que é read-only)
 */

export interface AttachOfferToCheckoutSmartResult {
  mode: "reused" | "cloned";
  offer_id: string;
  link_id: string;
  slug: string;
}

export interface SupabaseRPCExtensions {
  attach_offer_to_checkout_smart: {
    Args: { p_checkout_id: string; p_offer_id: string };
    Returns: AttachOfferToCheckoutSmartResult;
  };
  duplicate_checkout_shallow: {
    Args: { p_source_checkout_id: string };
    Returns: string;
  };
}
