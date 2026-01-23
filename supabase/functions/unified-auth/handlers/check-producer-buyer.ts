/**
 * Check Producer Buyer Handler
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Checks if a producer has buyer access to their own products.
 * Used for producers accessing their own members area.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../../_shared/response-helpers.ts";

const log = createLogger("UnifiedAuth:CheckProducerBuyer");

interface CheckProducerBuyerRequest {
  email: string;
  producerUserId?: string;
}

export async function handleCheckProducerBuyer(
  supabase: SupabaseClient,
  req: Request,
  corsHeaders: Record<string, string>
): Promise<Response> {
  try {
    const body: CheckProducerBuyerRequest = await req.json();
    const { email, producerUserId } = body;
    
    if (!email) {
      return errorResponse("Email é obrigatório", corsHeaders, 400);
    }
    
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if producer has their own products with members area
    let hasOwnProducts = false;
    if (producerUserId) {
      const { data: ownProducts } = await supabase
        .from("products")
        .select("id")
        .eq("user_id", producerUserId)
        .eq("members_area_enabled", true)
        .limit(1);
      hasOwnProducts = !!(ownProducts && ownProducts.length > 0);
    }
    
    // Check unified users table first
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    
    // Fall back to legacy buyer_profiles for backwards compatibility
    const { data: buyer } = await supabase
      .from("buyer_profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .single();
    
    const userId = user?.id || buyer?.id;
    
    if (!userId && !hasOwnProducts) {
      log.info(`No user profile or own products for: ${normalizedEmail}`);
      return jsonResponse({ hasBuyerProfile: false, hasOwnProducts: false }, corsHeaders, 200);
    }
    
    // Check for active product access
    let hasActiveAccess = false;
    if (userId) {
      // Check buyer_product_access (may still use buyer_id from legacy)
      const { data: access } = await supabase
        .from("buyer_product_access")
        .select("id")
        .eq("buyer_id", userId)
        .eq("is_active", true)
        .limit(1);
      hasActiveAccess = !!(access && access.length > 0);
    }
    
    const shouldShowStudentPanel = hasActiveAccess || hasOwnProducts;
    
    log.info(`Producer buyer check: ${normalizedEmail}, hasAccess: ${hasActiveAccess}, hasOwnProducts: ${hasOwnProducts}`);
    
    return jsonResponse({
      hasBuyerProfile: shouldShowStudentPanel,
      hasOwnProducts,
      buyerId: userId || null,
    }, corsHeaders, 200);
    
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Check producer buyer error:", msg);
    return errorResponse("Erro ao verificar acesso", corsHeaders, 500);
  }
}
