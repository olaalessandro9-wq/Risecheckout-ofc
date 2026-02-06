/**
 * students-access Edge Function
 * 
 * Handles student access management:
 * - grant-access: Grant product access to a buyer
 * - revoke-access: Revoke product access from a buyer
 * 
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("students-access");

// ============================================
// INTERFACES
// ============================================

interface JsonResponseData {
  success?: boolean;
  error?: string;
}

interface ProductRecord {
  id: string;
  user_id: string;
}

// ============================================
// MAIN HANDLER
// ============================================

Deno.serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;
  
  // Helper inside handler to capture corsHeaders
  function jsonResponse(data: JsonResponseData, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = getSupabaseClient('general');

    const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA, corsHeaders);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const { action, buyer_id, product_id, order_id } = body;

    log.info(`Action: ${action}`);

    // Require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    // Verify product ownership
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id")
        .eq("id", product_id)
        .single();

      const typedProduct = product as ProductRecord | null;

      if (productError || !typedProduct || typedProduct.user_id !== producer.id) {
        return jsonResponse({ error: "Product not found or access denied" }, 403);
      }
    }

    // ========== GRANT-ACCESS ==========
    // RISE V3 10.0/10: users table is the ONLY SSOT - zero fallbacks
    if (action === "grant-access") {
      if (!buyer_id || !product_id) {
        return jsonResponse({ error: "buyer_id and product_id required" }, 400);
      }

      // Verify buyer_id exists in users table (RISE V3 SSOT)
      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id")
        .eq("id", buyer_id)
        .single();

      // RISE V3: users is the only SSOT - no fallbacks to buyer_profiles
      if (userError || !user) {
        return jsonResponse({ error: "Buyer not found in users table" }, 404);
      }

      const { error } = await supabase
        .from("buyer_product_access")
        .upsert({
          buyer_id,
          product_id,
          order_id: order_id || null,
          is_active: true,
          access_type: "invite",
          granted_at: new Date().toISOString(),
        }, {
          onConflict: "buyer_id,product_id",
        });

      if (error) throw error;

      log.info(`Granted access to user ${buyer_id}`);
      return jsonResponse({ success: true });
    }

    // ========== REVOKE-ACCESS ==========
    if (action === "revoke-access") {
      if (!buyer_id || !product_id) {
        return jsonResponse({ error: "buyer_id and product_id required" }, 400);
      }

      const { error } = await supabase
        .from("buyer_product_access")
        .update({ is_active: false })
        .eq("buyer_id", buyer_id)
        .eq("product_id", product_id);

      if (error) throw error;

      log.info(`Revoked access for buyer ${buyer_id}`);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);

  } catch (error: unknown) {
    log.error("Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
