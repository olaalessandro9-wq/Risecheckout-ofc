/**
 * Ownership Verification Utilities
 * 
 * Centralizes ownership verification logic for products, checkouts, offers, etc.
 * 
 * @version 2.0.0 - Zero `any` compliance
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================
// TYPES FOR JOIN RESULTS
// ============================================

interface ProductOwner {
  user_id: string;
}

interface CheckoutWithProduct {
  id: string;
  name: string;
  is_default: boolean;
  product_id: string;
  products: ProductOwner | ProductOwner[];
}

interface OfferWithProduct {
  id: string;
  product_id: string;
  products: ProductOwner | ProductOwner[];
}

interface CheckoutNestedProducts {
  product_id: string;
  products: ProductOwner | ProductOwner[];
}

interface OrderBumpWithCheckout {
  id: string;
  checkout_id: string;
  checkouts: CheckoutNestedProducts | CheckoutNestedProducts[];
}

// ============================================
// OWNERSHIP VERIFICATION FUNCTIONS
// ============================================

/**
 * Verifies that a producer owns a product
 */
export async function verifyProductOwnership(
  supabase: SupabaseClient,
  productId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("user_id", producerId)
    .single();

  return !error && !!data;
}

/**
 * Extracts user_id from a possibly-array join result
 */
function extractProductOwner(productsData: ProductOwner | ProductOwner[]): ProductOwner | null {
  if (Array.isArray(productsData)) {
    return productsData[0] || null;
  }
  return productsData || null;
}

/**
 * Verifies that a producer owns a checkout (via product)
 */
export async function verifyCheckoutOwnership(
  supabase: SupabaseClient,
  checkoutId: string,
  producerId: string
): Promise<{ valid: boolean; checkout?: Record<string, unknown> }> {
  const { data, error } = await supabase
    .from("checkouts")
    .select("id, name, is_default, product_id, products!inner(user_id)")
    .eq("id", checkoutId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const typedData = data as unknown as CheckoutWithProduct;
  const product = extractProductOwner(typedData.products);
  
  if (product?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, checkout: data as Record<string, unknown> };
}

/**
 * Verifies that a producer owns an offer (via product)
 */
export async function verifyOfferOwnership(
  supabase: SupabaseClient,
  offerId: string,
  producerId: string
): Promise<{ valid: boolean; productId?: string }> {
  const { data, error } = await supabase
    .from("offers")
    .select("id, product_id, products!inner(user_id)")
    .eq("id", offerId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const typedData = data as unknown as OfferWithProduct;
  const product = extractProductOwner(typedData.products);
  
  if (product?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, productId: typedData.product_id };
}

/**
 * Extracts nested checkout data from a possibly-array join result
 */
function extractCheckoutData(checkoutsData: CheckoutNestedProducts | CheckoutNestedProducts[]): CheckoutNestedProducts | null {
  if (Array.isArray(checkoutsData)) {
    return checkoutsData[0] || null;
  }
  return checkoutsData || null;
}

/**
 * Verifies that a producer owns an order bump (via checkout → product)
 */
export async function verifyOrderBumpOwnership(
  supabase: SupabaseClient,
  orderBumpId: string,
  producerId: string
): Promise<{ valid: boolean; orderBump?: Record<string, unknown> }> {
  const { data, error } = await supabase
    .from("order_bumps")
    .select(`
      id, 
      checkout_id,
      checkouts!inner(
        product_id,
        products!inner(user_id)
      )
    `)
    .eq("id", orderBumpId)
    .single();

  if (error || !data) {
    return { valid: false };
  }

  const typedData = data as unknown as OrderBumpWithCheckout;
  const checkoutData = extractCheckoutData(typedData.checkouts);
  
  if (!checkoutData) {
    return { valid: false };
  }
  
  const productData = extractProductOwner(checkoutData.products);
  
  if (productData?.user_id !== producerId) {
    return { valid: false };
  }

  return { valid: true, orderBump: data as Record<string, unknown> };
}

/**
 * Verifies that a producer owns a pixel
 */
export async function verifyPixelOwnership(
  supabase: SupabaseClient,
  pixelId: string,
  producerId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("vendor_pixels")
    .select("id")
    .eq("id", pixelId)
    .eq("vendor_id", producerId)
    .single();

  return !error && !!data;
}

// ============================================
// AFFILIATE OWNERSHIP VERIFICATION
// ============================================

/**
 * Verifies that a user owns an affiliation
 * 
 * @param supabase - Supabase client
 * @param affiliateId - Affiliate record ID
 * @param userId - User ID to verify ownership
 * @returns True if user owns the affiliation
 */
export async function verifyAffiliateOwnership(
  supabase: SupabaseClient,
  affiliateId: string,
  userId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("affiliates")
    .select("id")
    .eq("id", affiliateId)
    .eq("user_id", userId)
    .maybeSingle();

  return !error && !!data;
}

/**
 * Verifies that a user owns an affiliation and returns the record
 * 
 * @param supabase - Supabase client
 * @param affiliateId - Affiliate record ID
 * @param userId - User ID to verify ownership
 * @returns Object with valid flag and optional affiliation data
 */
export async function verifyAffiliateOwnershipWithData(
  supabase: SupabaseClient,
  affiliateId: string,
  userId: string
): Promise<{ valid: boolean; affiliation?: AffiliateOwnershipData }> {
  const { data, error } = await supabase
    .from("affiliates")
    .select("id, product_id, status, affiliate_code")
    .eq("id", affiliateId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    return { valid: false };
  }

  return { 
    valid: true, 
    affiliation: data as AffiliateOwnershipData 
  };
}

// ============================================
// AFFILIATE OWNERSHIP TYPES
// ============================================

interface AffiliateOwnershipData {
  id: string;
  product_id: string;
  status: string;
  affiliate_code: string | null;
}
