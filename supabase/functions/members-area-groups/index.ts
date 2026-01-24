/**
 * members-area-groups - Router for member groups management
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance (Modular Router + Handlers)
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS, getClientIP } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer, unauthorizedResponse } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";
import { errorResponse, serverErrorResponse } from "../_shared/response-helpers.ts";

import type { GroupRequest, ProductRecord } from "./types.ts";
import { handleListGroups } from "./handlers/list.ts";
import { handleGetGroup } from "./handlers/get.ts";
import { handleCreateGroup } from "./handlers/create.ts";
import { handleUpdateGroup } from "./handlers/update.ts";
import { handleDeleteGroup } from "./handlers/delete.ts";
import { handleUpdatePermissions } from "./handlers/permissions.ts";
import { handleListOffers } from "./handlers/list_offers.ts";
import { handleLinkOffers } from "./handlers/link_offers.ts";

const log = createLogger("members-area-groups");

Deno.serve(async (req) => {
  // CORS V2 handler
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA, corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: GroupRequest = await req.json();

    // Authenticate producer
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return unauthorizedResponse(corsHeaders);
    }

    const { action, product_id, group_id, data } = body;
    log.info(`Action: ${action}, User: ${producer.id}`);

    // Verify product ownership
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id")
        .eq("id", product_id)
        .single() as { data: ProductRecord | null; error: Error | null };

      if (productError || !product || product.user_id !== producer.id) {
        return errorResponse("Product not found or access denied", corsHeaders, 403);
      }
    }

    // Route to handlers
    switch (action) {
      case "list":
        return handleListGroups(supabase, product_id, corsHeaders);
      case "get":
        return handleGetGroup(supabase, group_id, corsHeaders);
      case "create":
        return handleCreateGroup(supabase, product_id, data, corsHeaders);
      case "update":
        return handleUpdateGroup(supabase, group_id, data, corsHeaders);
      case "delete":
        return handleDeleteGroup(supabase, group_id, corsHeaders);
      case "permissions":
        return handleUpdatePermissions(supabase, group_id, data, corsHeaders);
      case "list_offers":
        return handleListOffers(supabase, product_id, corsHeaders);
      case "link_offers":
        return handleLinkOffers(supabase, group_id, data, corsHeaders);
      default:
        return errorResponse("Invalid action", corsHeaders, 400);
    }
  } catch (error: unknown) {
    log.error("Error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return errorResponse(message, corsHeaders, 500);
  }
});
