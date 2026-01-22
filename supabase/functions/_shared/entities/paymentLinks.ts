/**
 * Payment Links Entity Handler - Shared module
 * 
 * Single Source of Truth for fetching payment links.
 * Used by: product-full-loader, product-entities
 * 
 * @module _shared/entities/paymentLinks
 * @version RISE V3 Compliant
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";

const logger = createLogger("entities/paymentLinks");

/**
 * Fetches payment links for a product (simple version for BFF)
 * Gets links via checkout_links table
 */
export async function fetchProductPaymentLinks(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  // Get checkout IDs for this product
  const { data: checkouts, error: checkoutsError } = await supabase
    .from("checkouts")
    .select("id")
    .eq("product_id", productId);

  if (checkoutsError) {
    logger.error("Failed to fetch checkouts for payment links", { 
      productId, 
      error: checkoutsError.message 
    });
    throw new Error(`checkouts: ${checkoutsError.message}`);
  }

  const checkoutIds = (checkouts ?? []).map((c: { id: string }) => c.id);
  if (checkoutIds.length === 0) {
    return [];
  }

  // Get link IDs via checkout_links
  const { data: checkoutLinks, error: linksError } = await supabase
    .from("checkout_links")
    .select("link_id")
    .in("checkout_id", checkoutIds);

  if (linksError) {
    logger.error("Failed to fetch checkout links", { 
      productId, 
      error: linksError.message 
    });
    throw new Error(`checkout_links: ${linksError.message}`);
  }

  const linkIds = (checkoutLinks ?? []).map((cl: { link_id: string }) => cl.link_id);
  if (linkIds.length === 0) {
    return [];
  }

  // Get actual payment links
  const { data, error } = await supabase
    .from("payment_links")
    .select("*")
    .in("id", linkIds);

  if (error) {
    logger.error("Failed to fetch payment links", { productId, error: error.message });
    throw new Error(`payment_links: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetches payment links with full relations (for entities endpoint)
 */
export async function fetchProductPaymentLinksWithRelations(
  supabase: SupabaseClient,
  productId: string
): Promise<Record<string, unknown>[]> {
  // Get offer IDs for this product (only active offers)
  const { data: offers, error: offersError } = await supabase
    .from("offers")
    .select("id")
    .eq("product_id", productId)
    .eq("status", "active");

  if (offersError) {
    logger.error("Failed to fetch offers for payment links", { 
      productId, 
      error: offersError.message 
    });
    throw new Error(`offers: ${offersError.message}`);
  }

  const offerIds = (offers ?? []).map((o: { id: string }) => o.id);
  if (offerIds.length === 0) {
    return [];
  }

  // Get payment links with offers
  const { data: links, error: linksError } = await supabase
    .from("payment_links")
    .select(`
      id,
      slug,
      url,
      status,
      offers (
        id,
        name,
        price,
        is_default,
        product_id
      )
    `)
    .in("offer_id", offerIds);

  if (linksError) {
    logger.error("Failed to fetch payment links with relations", { 
      productId, 
      error: linksError.message 
    });
    throw new Error(`payment_links: ${linksError.message}`);
  }

  // Get checkouts for each link
  const linksWithCheckouts = await Promise.all(
    (links ?? []).map(async (link: { id: string }) => {
      const { data: checkoutLinks } = await supabase
        .from("checkout_links")
        .select("checkout_id")
        .eq("link_id", link.id);

      const checkoutIds = (checkoutLinks ?? []).map(
        (cl: { checkout_id: string }) => cl.checkout_id
      );
      
      let checkouts: Array<{ id: string; name: string }> = [];
      if (checkoutIds.length > 0) {
        const { data: checkoutsData } = await supabase
          .from("checkouts")
          .select("id, name")
          .in("id", checkoutIds);
        checkouts = checkoutsData ?? [];
      }

      return { ...link, checkouts };
    })
  );

  return linksWithCheckouts;
}
