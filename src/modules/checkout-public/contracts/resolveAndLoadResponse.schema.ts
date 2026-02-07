/**
 * Zod Schemas for checkout-public-data BFF Response
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Strong contracts ensure type safety and runtime validation.
 * This ELIMINATES the entire class of "null pointer / shape mismatch" bugs.
 * 
 * @module checkout-public/contracts
 */

import { z } from "zod";

// ============================================================================
// AFFILIATE SCHEMA
// ============================================================================

export const AffiliateSchema = z.object({
  affiliateId: z.string(),
  affiliateCode: z.string(),
  affiliateUserId: z.string(),
  commissionRate: z.number().nullable(),
  pixGateway: z.string().nullable(),
  creditCardGateway: z.string().nullable(),
}).nullable();

export type AffiliateData = z.infer<typeof AffiliateSchema>;

// ============================================================================
// OFFER SCHEMA
// ============================================================================

export const OfferSchema = z.object({
  offerId: z.string(),
  offerName: z.string(),
  offerPrice: z.number(),
}).nullable();

export type OfferData = z.infer<typeof OfferSchema>;

// ============================================================================
// ORDER BUMP SCHEMA
// ============================================================================

export const OrderBumpSchema = z.object({
  id: z.string(),
  product_id: z.string().nullable(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  original_price: z.number().nullable(),
  image_url: z.string().nullable(),
  call_to_action: z.string().nullable(),
  product: z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().nullable(),
    price: z.number(),
    image_url: z.string().nullable(),
  }).nullable(),
  offer: z.object({
    id: z.string(),
    name: z.string(),
    price: z.number(),
  }).nullable(),
});

export type OrderBumpData = z.infer<typeof OrderBumpSchema>;

// ============================================================================
// PRODUCT SCHEMA
// ============================================================================

export const ProductSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  image_url: z.string().nullable(),
  support_name: z.string().nullable(),
  required_fields: z.unknown().nullable(),
  default_payment_method: z.enum(['pix', 'credit_card']).nullable(),
  upsell_settings: z.unknown().nullable(),
  affiliate_settings: z.unknown().nullable(),
  status: z.string().nullable(),
  pix_gateway: z.string().nullable(),
  credit_card_gateway: z.string().nullable(),
});

export type ProductData = z.infer<typeof ProductSchema>;

// ============================================================================
// CHECKOUT SCHEMA
// ============================================================================

/**
 * RISE V3: Checkout schema reflects SSOT architecture.
 * Individual color columns are DEPRECATED and not included.
 * All color data comes from the `design` JSON field.
 */
export const CheckoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  visits_count: z.number(),
  seller_name: z.string().nullable(),
  font: z.string().nullable(),
  components: z.unknown().nullable(),
  top_components: z.unknown().nullable(),
  bottom_components: z.unknown().nullable(),
  mobile_top_components: z.unknown().nullable().optional(),
  mobile_bottom_components: z.unknown().nullable().optional(),
  design: z.unknown().nullable(),
  theme: z.string().nullable(),
  pix_gateway: z.string().nullable(),
  credit_card_gateway: z.string().nullable(),
  mercadopago_public_key: z.string().nullable(),
  stripe_public_key: z.string().nullable(),
});

export type CheckoutData = z.infer<typeof CheckoutSchema>;

// ============================================================================
// PRODUCT PIXELS SCHEMA (Phase 2 - BFF Unified)
// ============================================================================

export const ProductPixelSchema = z.object({
  id: z.string(),
  platform: z.string(),
  pixel_id: z.string(),
  access_token: z.string().nullable(),
  conversion_label: z.string().nullable(),
  domain: z.string().nullable(),
  is_active: z.boolean(),
  fire_on_initiate_checkout: z.boolean(),
  fire_on_purchase: z.boolean(),
  fire_on_pix: z.boolean(),
  fire_on_card: z.boolean(),
  fire_on_boleto: z.boolean(),
  custom_value_percent: z.number().nullable(),
});

export type ProductPixelData = z.infer<typeof ProductPixelSchema>;

// ============================================================================
// VENDOR INTEGRATION SCHEMA (Phase 2 - UTMify)
// ============================================================================

export const VendorIntegrationSchema = z.object({
  id: z.string(),
  vendor_id: z.string(),
  active: z.boolean(),
  config: z.unknown().nullable(),
}).nullable();

export type VendorIntegrationData = z.infer<typeof VendorIntegrationSchema>;

// ============================================================================
// FULL RESPONSE SCHEMA
// ============================================================================

export const ResolveAndLoadResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    checkout: CheckoutSchema,
    product: ProductSchema,
    offer: OfferSchema,
    orderBumps: z.array(OrderBumpSchema),
    affiliate: AffiliateSchema,
    // Phase 2 additions
    productPixels: z.array(ProductPixelSchema).optional().default([]),
    vendorIntegration: VendorIntegrationSchema.optional().nullable(),
  }),
});

export type ResolveAndLoadResponse = z.infer<typeof ResolveAndLoadResponseSchema>;

// ============================================================================
// ERROR RESPONSE SCHEMA
// ============================================================================

export const ErrorResponseSchema = z.object({
  success: z.literal(false).optional(),
  error: z.string(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

export function validateResolveAndLoadResponse(data: unknown): {
  success: true;
  data: ResolveAndLoadResponse;
} | {
  success: false;
  error: string;
  details: z.ZodError;
} {
  const result = ResolveAndLoadResponseSchema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  return {
    success: false,
    error: "BFF response validation failed",
    details: result.error,
  };
}
