/**
 * Mapper: BFF Response → UI Models
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * This is the SINGLE SOURCE OF TRUTH for transforming BFF data to UI models.
 * All null handling, fallbacks, and gateway resolution happens HERE.
 * 
 * SSOT: Design colors come ONLY from checkout.design.colors JSON.
 * Individual color columns are DEPRECATED and not used.
 * 
 * @module checkout-public/mappers
 */

import { parseJsonSafely } from "@/lib/utils";
import { normalizeDesign } from "@/lib/checkout/normalizeDesign";
import type { ThemePreset } from "@/lib/checkout/themePresets";
import type { ResolveAndLoadResponse } from "../contracts";

// ============================================================================
// UI MODEL TYPES
// ============================================================================

// Import RequiredFieldsConfig from canonical source
import { 
  type RequiredFieldsConfig, 
  normalizeRequiredFields,
} from "@/types/checkout-shared.types";

// Re-export for consumers of this module
export type { RequiredFieldsConfig };
export { normalizeRequiredFields };

export interface AffiliateSettings {
  enabled?: boolean;
  commissionPercentage?: number;
  cookieDuration?: number;
  attributionModel?: 'last_click' | 'first_click';
}

export interface ProductUIModel {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string | null;
  support_name?: string;
  required_fields: RequiredFieldsConfig;
  default_payment_method: 'pix' | 'credit_card';
  upsell_settings?: unknown;
  affiliate_settings?: AffiliateSettings;
}

export interface CheckoutUIModel {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  visits_count: number;
  seller_name?: string;
  font?: string;
  components?: unknown[];
  top_components?: unknown[];
  bottom_components?: unknown[];
  rows?: unknown[];
  design?: unknown;
  theme?: string;
}

export interface OfferUIModel {
  offerId: string;
  offerName: string;
  offerPrice: number;
}

export interface AffiliateUIModel {
  affiliateId: string;
  affiliateCode: string;
  affiliateUserId: string;
  commissionRate: number | null;
  pixGateway: string | null;
  creditCardGateway: string | null;
}

export interface OrderBumpUIModel {
  id: string;
  product_id: string | null;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  call_to_action: string | null;
}

export type PixGateway = 'pushinpay' | 'mercadopago' | 'stripe' | 'asaas';
export type CreditCardGateway = 'mercadopago' | 'stripe' | 'asaas';

export interface ResolvedGateways {
  pix: PixGateway;
  creditCard: CreditCardGateway;
  mercadoPagoPublicKey: string | null;
  stripePublicKey: string | null;
}

export interface MappedCheckoutData {
  checkout: CheckoutUIModel;
  product: ProductUIModel;
  offer: OfferUIModel | null;
  orderBumps: OrderBumpUIModel[];
  affiliate: AffiliateUIModel | null;
  resolvedGateways: ResolvedGateways;
  design: ThemePreset;
  // Phase 2 additions
  productPixels: ProductPixelUIModel[];
  vendorIntegration: VendorIntegrationUIModel | null;
}

// Phase 2 UI Models
export interface ProductPixelUIModel {
  id: string;
  platform: string;
  pixel_id: string;
  access_token?: string | null;
  conversion_label?: string | null;
  domain?: string | null;
  is_active: boolean;
  fire_on_initiate_checkout: boolean;
  fire_on_purchase: boolean;
  fire_on_pix: boolean;
  fire_on_card: boolean;
  fire_on_boleto: boolean;
  custom_value_percent: number;
}

export interface VendorIntegrationUIModel {
  id: string;
  vendor_id: string;
  active: boolean;
  config: unknown;
}

// ============================================================================
// MAPPER FUNCTION
// ============================================================================

/**
 * Maps BFF response to UI-ready models with all fallbacks applied.
 * 
 * RISE V3: Design normalization uses ONLY checkout.design JSON.
 * Individual color columns are NOT passed to normalizeDesign.
 */
export function mapResolveAndLoad(response: ResolveAndLoadResponse): MappedCheckoutData {
  const { checkout, product, offer, orderBumps, affiliate } = response.data;

  // =========================================================================
  // RESOLVE GATEWAYS (affiliate overrides product if configured)
  // =========================================================================
  const resolvedGateways: ResolvedGateways = {
    pix: (affiliate?.pixGateway || product.pix_gateway || 'mercadopago') as PixGateway,
    creditCard: (affiliate?.creditCardGateway || product.credit_card_gateway || 'mercadopago') as CreditCardGateway,
    mercadoPagoPublicKey: checkout.mercadopago_public_key || null,
    stripePublicKey: checkout.stripe_public_key || null,
  };

  // =========================================================================
  // RESOLVE PRICE (offer → product fallback)
  // =========================================================================
  const finalPrice = offer?.offerPrice ?? product.price;

  // =========================================================================
  // NORMALIZE REQUIRED FIELDS
  // =========================================================================
  const rawRequiredFields = product.required_fields as { phone?: boolean; cpf?: boolean } | null;
  const requiredFields: RequiredFieldsConfig = {
    name: true,
    email: true,
    phone: rawRequiredFields?.phone ?? false,
    cpf: rawRequiredFields?.cpf ?? false,
  };

  // =========================================================================
  // MAP CHECKOUT
  // =========================================================================
  const checkoutUI: CheckoutUIModel = {
    id: checkout.id,
    vendorId: product.user_id,
    name: checkout.name,
    slug: checkout.slug,
    visits_count: checkout.visits_count,
    seller_name: checkout.seller_name ?? undefined,
    font: checkout.font ?? undefined,
    components: parseJsonSafely(checkout.components, []),
    top_components: parseJsonSafely(checkout.top_components, []),
    bottom_components: parseJsonSafely(checkout.bottom_components, []),
    rows: parseJsonSafely(checkout.components, []),
    design: parseJsonSafely(checkout.design, {}),
    theme: checkout.theme ?? undefined,
  };

  // =========================================================================
  // MAP PRODUCT
  // =========================================================================
  const productUI: ProductUIModel = {
    id: product.id,
    name: product.name,
    description: product.description || '',
    price: finalPrice,
    image_url: product.image_url,
    support_name: product.support_name ?? undefined,
    required_fields: requiredFields,
    default_payment_method: (product.default_payment_method as 'pix' | 'credit_card') ?? 'pix',
    upsell_settings: product.upsell_settings,
    affiliate_settings: product.affiliate_settings as AffiliateSettings | undefined,
  };

  // =========================================================================
  // MAP OFFER (nullable)
  // =========================================================================
  const offerUI: OfferUIModel | null = offer
    ? {
        offerId: offer.offerId,
        offerName: offer.offerName,
        offerPrice: offer.offerPrice,
      }
    : null;

  // =========================================================================
  // MAP ORDER BUMPS
  // =========================================================================
  const orderBumpsUI: OrderBumpUIModel[] = orderBumps.map((bump) => ({
    id: bump.id,
    product_id: bump.product_id,
    name: bump.name,
    description: bump.description || '',
    price: bump.price,
    original_price: bump.original_price,
    image_url: bump.image_url,
    call_to_action: bump.call_to_action,
  }));

  // =========================================================================
  // MAP AFFILIATE (nullable)
  // =========================================================================
  const affiliateUI: AffiliateUIModel | null = affiliate
    ? {
        affiliateId: affiliate.affiliateId,
        affiliateCode: affiliate.affiliateCode,
        affiliateUserId: affiliate.affiliateUserId,
        commissionRate: affiliate.commissionRate,
        pixGateway: affiliate.pixGateway,
        creditCardGateway: affiliate.creditCardGateway,
      }
    : null;

  // =========================================================================
  // NORMALIZE DESIGN - SSOT from design JSON only
  // =========================================================================
  const designData = {
    theme: checkout.theme,
    design: parseJsonSafely(checkout.design, null),
  };
  
  const design = normalizeDesign(designData);

  // =========================================================================
  // MAP PRODUCT PIXELS (Phase 2)
  // =========================================================================
  const productPixels: ProductPixelUIModel[] = (response.data.productPixels || []).map((p) => ({
    id: p.id,
    platform: p.platform,
    pixel_id: p.pixel_id,
    access_token: p.access_token,
    conversion_label: p.conversion_label,
    domain: p.domain,
    is_active: p.is_active,
    fire_on_initiate_checkout: p.fire_on_initiate_checkout,
    fire_on_purchase: p.fire_on_purchase,
    fire_on_pix: p.fire_on_pix,
    fire_on_card: p.fire_on_card,
    fire_on_boleto: p.fire_on_boleto,
    custom_value_percent: p.custom_value_percent ?? 100,
  }));

  // =========================================================================
  // MAP VENDOR INTEGRATION (Phase 2)
  // =========================================================================
  const vendorIntegration: VendorIntegrationUIModel | null = response.data.vendorIntegration
    ? {
        id: response.data.vendorIntegration.id,
        vendor_id: response.data.vendorIntegration.vendor_id,
        active: response.data.vendorIntegration.active,
        config: response.data.vendorIntegration.config,
      }
    : null;

  return {
    checkout: checkoutUI,
    product: productUI,
    offer: offerUI,
    orderBumps: orderBumpsUI,
    affiliate: affiliateUI,
    resolvedGateways,
    design,
    productPixels,
    vendorIntegration,
  };
}
