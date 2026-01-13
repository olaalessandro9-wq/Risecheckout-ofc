/**
 * students-access Edge Function
 * 
 * Handles student access management:
 * - grant-access: Grant product access to a buyer
 * - revoke-access: Revoke product access from a buyer
 * 
 * RISE Protocol Compliant
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCors, PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiter.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

function jsonResponse(data: any, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await rateLimitMiddleware(supabase as any, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const { action, buyer_id, product_id, order_id } = body;

    console.log(`[students-access] Action: ${action}`);

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

      if (productError || !product || product.user_id !== producer.id) {
        return jsonResponse({ error: "Product not found or access denied" }, 403);
      }
    }

    // ========== GRANT-ACCESS ==========
    if (action === "grant-access") {
      if (!buyer_id || !product_id) {
        return jsonResponse({ error: "buyer_id and product_id required" }, 400);
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

      console.log(`[students-access] Granted access to buyer ${buyer_id}`);
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

      console.log(`[students-access] Revoked access for buyer ${buyer_id}`);
      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action" }, 400);

  } catch (error: unknown) {
    console.error("[students-access] Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
