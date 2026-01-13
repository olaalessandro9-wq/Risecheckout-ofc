/**
 * students-groups Edge Function
 * 
 * Handles student group management:
 * - add-to-group: Add buyer to a group
 * - remove-from-group: Remove buyer from a group
 * - assign-groups: Replace all groups for a buyer
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
    const { action, buyer_id, group_id, group_ids, product_id } = body;

    console.log(`[students-groups] Action: ${action}`);

    // Require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return jsonResponse({ error: "Authorization required" }, 401);
    }

    // Verify product ownership if product_id provided
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

    // ========== ADD-TO-GROUP ==========
    if (action === "add-to-group") {
      if (!buyer_id || !group_id) {
        return jsonResponse({ error: "buyer_id and group_id required" }, 400);
      }

      const { error } = await supabase
        .from("buyer_groups")
        .upsert({
          buyer_id,
          group_id,
          is_active: true,
          granted_at: new Date().toISOString(),
        }, {
          onConflict: "buyer_id,group_id",
        });

      if (error) throw error;

      console.log(`[students-groups] Added buyer ${buyer_id} to group ${group_id}`);
      return jsonResponse({ success: true });
    }

    // ========== REMOVE-FROM-GROUP ==========
    if (action === "remove-from-group") {
      if (!buyer_id || !group_id) {
        return jsonResponse({ error: "buyer_id and group_id required" }, 400);
      }

      const { error } = await supabase
        .from("buyer_groups")
        .update({ is_active: false })
        .eq("buyer_id", buyer_id)
        .eq("group_id", group_id);

      if (error) throw error;

      console.log(`[students-groups] Removed buyer ${buyer_id} from group ${group_id}`);
      return jsonResponse({ success: true });
    }

    // ========== ASSIGN-GROUPS ==========
    if (action === "assign-groups") {
      if (!buyer_id || !group_ids) {
        return jsonResponse({ error: "buyer_id and group_ids required" }, 400);
      }

      // Delete all existing groups for this buyer
      const { error: deleteError } = await supabase
        .from("buyer_groups")
        .delete()
        .eq("buyer_id", buyer_id);

      if (deleteError) throw deleteError;

      // Insert new groups if any
      if (group_ids.length > 0) {
        const groupInserts = group_ids.map((gid: string) => ({
          buyer_id,
          group_id: gid,
          is_active: true,
          granted_at: new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from("buyer_groups")
          .insert(groupInserts);

        if (insertError) throw insertError;
      }

      console.log(`[students-groups] Assigned ${group_ids.length} groups to buyer ${buyer_id}`);
      return jsonResponse({ success: true, groups_count: group_ids.length });
    }

    return jsonResponse({ error: "Invalid action" }, 400);

  } catch (error: unknown) {
    console.error("[students-groups] Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
