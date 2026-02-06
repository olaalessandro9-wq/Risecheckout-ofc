/**
 * students-groups Edge Function
 * 
 * Handles student group management:
 * - add-to-group: Add buyer to a group
 * - remove-from-group: Remove buyer from a group
 * - assign-groups: Replace all groups for a buyer
 * 
 * @version 2.0.0
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("students-groups");

// ============================================
// INTERFACES
// ============================================

interface JsonResponseData {
  success?: boolean;
  error?: string;
  groups_count?: number;
  groups?: ProductMemberGroup[];
}

interface ProductMemberGroup {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  position: number;
  created_at: string;
  updated_at: string;
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
    const { action, buyer_id, group_id, group_ids, product_id } = body;

    log.info(`Action: ${action}`);

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

      const typedProduct = product as ProductRecord | null;

      if (productError || !typedProduct || typedProduct.user_id !== producer.id) {
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

      log.info(`Added buyer ${buyer_id} to group ${group_id}`);
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

      log.info(`Removed buyer ${buyer_id} from group ${group_id}`);
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

      log.info(`Assigned ${group_ids.length} groups to buyer ${buyer_id}`);
      return jsonResponse({ success: true, groups_count: group_ids.length });
    }

    // ========== LIST-GROUPS ==========
    if (action === "list-groups") {
      if (!product_id) {
        return jsonResponse({ error: "product_id required" }, 400);
      }

      const { data: groups, error } = await supabase
        .from("product_member_groups")
        .select("*")
        .eq("product_id", product_id)
        .order("position", { ascending: true });

      if (error) throw error;

      log.info(`Listed ${groups?.length || 0} groups for product ${product_id}`);
      return jsonResponse({ success: true, groups: groups as ProductMemberGroup[] });
    }

    return jsonResponse({ error: "Invalid action" }, 400);

  } catch (error: unknown) {
    log.error("Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500);
  }
});
