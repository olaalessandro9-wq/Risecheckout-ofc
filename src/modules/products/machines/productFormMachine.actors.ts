/**
 * ProductFormMachine Actors
 * 
 * Actors (invoked services) para operações assíncronas.
 * Carregamento de dados e salvamento são delegados a actors.
 * 
 * @see RISE ARCHITECT PROTOCOL V3 - Solução 10.0/10
 * @module products/machines
 */

import { fromPromise } from "xstate";
import type { LoadProductInput, MappedProductData } from "./productFormMachine.types";
import { api } from "@/lib/api";
import { createLogger } from "@/lib/logger";

const logger = createLogger("productFormMachine.actors");

// ============================================================================
// LOAD PRODUCT ACTOR
// ============================================================================

interface ProductFullResponse {
  success: boolean;
  data?: {
    product: MappedProductData["product"];
    upsellSettings: {
      upsell_enabled: boolean;
      upsell_product_id: string | null;
      upsell_offer_id: string | null;
      upsell_checkout_id: string | null;
      upsell_timer_enabled: boolean;
      upsell_timer_minutes: number;
      upsell_custom_page_url: string | null;
    };
    affiliateSettings: {
      affiliate_enabled: boolean;
      affiliate_commission_type: string;
      affiliate_commission_value: number;
      affiliate_cookie_days: number;
      affiliate_approval_mode: string;
      affiliate_allow_coupon: boolean;
      affiliate_public_in_marketplace: boolean;
    };
    offers: Array<{
      id: string;
      product_id: string;
      name: string;
      price: number;
      is_default: boolean;
      created_at: string;
      updated_at: string | null;
    }>;
    orderBumps: Array<{
      id: string;
      custom_title: string | null;
      custom_description: string | null;
      /** MARKETING price - for strikethrough display only, never used for billing */
      original_price: number | null;
      product_id: string;
      products?: {
        id: string;
        name: string;
        price: number;
        image_url: string | null;
      } | null;
      created_at: string;
    }>;
    checkouts: Array<{
      id: string;
      name: string;
      is_default: boolean;
      visits_count: number;
      status: string | null;
      product_id: string;
      created_at: string;
      products?: { name: string; price: number } | null;
      checkout_links?: Array<{
        link_id: string;
        payment_links?: {
          offers?: { name: string; price: number } | null;
        } | null;
      }>;
    }>;
    paymentLinks: Array<{
      id: string;
      slug: string;
      url?: string;
      status?: string;
      
      created_at?: string;
      offers?: {
        id: string;
        name: string;
        price: number;
        is_default: boolean;
        product_id: string;
      } | null;
      checkouts?: Array<{ id: string; name: string }>;
    }>;
    coupons: Array<{
      id: string;
      code: string;
      name: string | null;
      discount_type: string;
      discount_value: number;
      max_uses: number | null;
      uses_count: number | null;
      expires_at: string | null;
      start_date: string | null;
      active: boolean;
      apply_to_order_bumps: boolean | null;
      created_at: string;
    }>;
  };
  error?: string;
}

/**
 * Mapeia dados do BFF para o formato interno da máquina
 */
function mapBffToMachine(data: ProductFullResponse["data"]): MappedProductData {
  if (!data) {
    throw new Error("No data received from BFF");
  }

  const product = data.product;
  
  // Map upsell settings
  const upsellSettings = {
    hasCustomThankYouPage: !!data.upsellSettings.upsell_custom_page_url,
    customPageUrl: data.upsellSettings.upsell_custom_page_url ?? "",
    redirectIgnoringOrderBumpFailures: false,
  };
  
  // Map affiliate settings
  const affiliateSettings = {
    enabled: data.affiliateSettings.affiliate_enabled,
    defaultRate: data.affiliateSettings.affiliate_commission_value,
    requireApproval: data.affiliateSettings.affiliate_approval_mode === "manual",
    attributionModel: "last_click" as const,
    cookieDuration: data.affiliateSettings.affiliate_cookie_days,
    showInMarketplace: data.affiliateSettings.affiliate_public_in_marketplace,
  };
  
  // Map offers
  const offers = data.offers.map(o => ({
    id: o.id,
    product_id: o.product_id,
    name: o.name,
    price: o.price,
    is_default: o.is_default,
    created_at: o.created_at,
    updated_at: o.updated_at ?? undefined,
  }));
  
  // Map order bumps
  // CRITICAL: Price is ALWAYS from product, never from original_price
  // original_price is MARKETING ONLY (strikethrough display)
  const orderBumps = data.orderBumps.map(ob => ({
    id: ob.id,
    name: ob.custom_title ?? ob.products?.name ?? "Order Bump",
    description: ob.custom_description,
    // REAL PRICE: Always from product (original_price is marketing only)
    price: ob.products?.price ?? 0,
    image_url: ob.products?.image_url ?? null,
    bump_product_id: ob.product_id,
    created_at: ob.created_at,
  }));
  
  // Map checkouts
  const checkouts = data.checkouts.map(c => {
    const firstLink = c.checkout_links?.[0];
    const offerName = firstLink?.payment_links?.offers?.name ?? c.products?.name ?? "";
    const offerPrice = firstLink?.payment_links?.offers?.price ?? c.products?.price ?? 0;
    
    return {
      id: c.id,
      name: c.name,
      price: offerPrice,
      visits: c.visits_count,
      offer: offerName,
      isDefault: c.is_default,
      linkId: firstLink?.link_id ?? "",
      product_id: c.product_id,
      status: c.status ?? undefined,
      created_at: c.created_at,
    };
  });
  
  // Map payment links
  const paymentLinks = data.paymentLinks.map(pl => ({
    id: pl.id,
    slug: pl.slug,
    url: pl.url ?? "",
    offer_name: pl.offers?.name ?? "",
    offer_price: pl.offers?.price ?? 0,
    is_default: pl.offers?.is_default ?? false,
    status: (pl.status === "active" ? "active" : "inactive") as "active" | "inactive",
    checkouts: pl.checkouts ?? [],
    created_at: pl.created_at,
  }));
  
  // Map coupons
  const coupons = data.coupons.map(c => ({
    id: c.id,
    code: c.code,
    discount: c.discount_value,
    discount_type: "percentage" as const, // RISE V3: Apenas porcentagem suportado
    startDate: c.start_date ? new Date(c.start_date) : new Date(),
    endDate: c.expires_at ? new Date(c.expires_at) : new Date(),
    usageCount: c.uses_count ?? 0,
    max_uses: c.max_uses,
    applyToOrderBumps: c.apply_to_order_bumps ?? false,
    created_at: c.created_at,
    expires_at: c.expires_at ?? undefined,
  }));

  return {
    product,
    upsellSettings,
    affiliateSettings,
    offers,
    orderBumps,
    checkouts,
    paymentLinks,
    coupons,
  };
}

/**
 * Actor para carregar dados completos do produto
 */
export const loadProductActor = fromPromise<MappedProductData, LoadProductInput>(
  async ({ input }) => {
    const { productId } = input;
    
    if (!productId) {
      throw new Error("Product ID is required");
    }
    
    logger.info("Loading product data", { productId });
    
    const { data: response, error: fetchError } = await api.call<ProductFullResponse>(
      "product-full-loader",
      { action: "load-full", productId }
    );
    
    if (fetchError) {
      logger.error("Edge function error", { productId, error: fetchError.message });
      throw new Error(fetchError.message);
    }
    
    if (!response?.success || !response?.data) {
      const errorMsg = response?.error ?? "Failed to load product data";
      logger.error("Invalid response", { productId, error: errorMsg });
      throw new Error(errorMsg);
    }
    
    logger.info("Product data loaded successfully", { productId });
    return mapBffToMachine(response.data);
  }
);

// ============================================================================
// SAVE ALL ACTOR
// ============================================================================

interface SaveAllResult {
  success: boolean;
  failedTabs: string[];
}

/**
 * Actor para salvar todas as alterações
 * Delega para o SaveRegistry que coordena os handlers
 */
export const saveAllActor = fromPromise<SaveAllResult, { executeAll: () => Promise<SaveAllResult> }>(
  async ({ input }) => {
    logger.info("Executing saveAll via registry");
    
    try {
      const result = await input.executeAll();
      
      if (!result.success) {
        logger.warn("SaveAll completed with failures", { failedTabs: result.failedTabs });
      } else {
        logger.info("SaveAll completed successfully");
      }
      
      return result;
    } catch (error) {
      logger.error("SaveAll failed", { error });
      throw error;
    }
  }
);
