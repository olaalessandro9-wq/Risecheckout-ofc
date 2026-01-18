/**
 * Affiliation Queries - Mappers
 *
 * Data transformation functions for affiliation-related data.
 *
 * @version 1.0.0
 * @see RISE ARCHITECT PROTOCOL V3 - SRP & Modularization
 * @module _shared/affiliation-queries/mappers
 */

import type { OfferRecord, CheckoutRecord, ProductRecord } from "./types.ts";

/**
 * Map offers with payment link slugs
 */
export function mapOffersWithPaymentSlug(offers: OfferRecord[]) {
  return offers.map((o) => {
    const activeLink = o.payment_links?.find((l) => l.status === "active");
    const firstLink = o.payment_links?.[0];
    const paymentLink = activeLink || firstLink;

    return {
      id: o.id,
      name: o.name,
      price: o.price / 100,
      status: o.status,
      is_default: o.is_default,
      payment_link_slug: paymentLink?.slug || null,
    };
  });
}

/**
 * Map checkouts with payment link slugs
 */
export function mapCheckoutsWithPaymentSlug(checkouts: CheckoutRecord[]) {
  return checkouts.map((c) => {
    const firstLink = c.checkout_links?.[0]?.payment_links;
    const slug = Array.isArray(firstLink) ? firstLink[0]?.slug : firstLink?.slug;
    return {
      id: c.id,
      slug: c.slug,
      payment_link_slug: slug || null,
      is_default: c.is_default,
      status: c.status,
    };
  });
}

/**
 * Extract and normalize gateway settings
 */
export function extractGatewaySettings(product: ProductRecord | null): {
  pix_allowed: string[];
  credit_card_allowed: string[];
  require_gateway_connection: boolean;
} {
  const settings = product?.affiliate_gateway_settings || {};
  return {
    pix_allowed: settings.pix_allowed || ["asaas"],
    credit_card_allowed: settings.credit_card_allowed || ["mercadopago", "stripe"],
    require_gateway_connection: settings.require_gateway_connection ?? true,
  };
}
