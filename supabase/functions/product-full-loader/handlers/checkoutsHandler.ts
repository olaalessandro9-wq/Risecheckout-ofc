/**
 * Checkouts Handler - Fetches checkouts and payment links
 * 
 * @module product-full-loader/handlers
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { CheckoutRecord, PaymentLinkRecord } from "../types.ts";

interface CheckoutsHandlerResult {
  checkouts: CheckoutRecord[];
  paymentLinks: PaymentLinkRecord[];
}

export async function fetchCheckoutsAndLinks(
  supabase: SupabaseClient,
  productId: string
): Promise<CheckoutsHandlerResult> {
  // Fetch checkouts
  const { data: checkoutsData, error: checkoutsError } = await supabase
    .from("checkouts")
    .select(`
      id,
      product_id,
      name,
      slug,
      is_default,
      status,
      theme,
      visits_count,
      created_at,
      updated_at
    `)
    .eq("product_id", productId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (checkoutsError) {
    throw new Error(`Failed to fetch checkouts: ${checkoutsError.message}`);
  }

  const checkouts = (checkoutsData ?? []) as CheckoutRecord[];
  const checkoutIds = checkouts.map(c => c.id);

  // Fetch payment links for these checkouts
  let paymentLinks: PaymentLinkRecord[] = [];
  
  if (checkoutIds.length > 0) {
    const { data: linksData, error: linksError } = await supabase
      .from("payment_links")
      .select(`
        id,
        checkout_id,
        offer_id,
        slug,
        active,
        created_at
      `)
      .in("checkout_id", checkoutIds)
      .order("created_at", { ascending: true });

    if (linksError) {
      throw new Error(`Failed to fetch payment links: ${linksError.message}`);
    }

    paymentLinks = (linksData ?? []) as PaymentLinkRecord[];
  }

  return {
    checkouts,
    paymentLinks,
  };
}
