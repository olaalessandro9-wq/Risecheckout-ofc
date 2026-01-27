/**
 * students-list Edge Function - Router
 * RISE Protocol V3 Compliant - Pure Router Pattern
 * 
 * @version 3.0.0 - Modular Architecture
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, RATE_LIMIT_CONFIGS } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

import type { ListRequest } from "./types.ts";
import { jsonResponse } from "./helpers.ts";
import { handleListStudents } from "./handlers/list.ts";
import { handleGetStudent } from "./handlers/get.ts";
import { handleGetProducerInfo } from "./handlers/get_producer_info.ts";

const log = createLogger("students-list");

Deno.serve(async (req) => {
  // CORS V2 - Dynamic origin validation
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await rateLimitMiddleware(supabase, req, RATE_LIMIT_CONFIGS.MEMBERS_AREA, corsHeaders);
    if (rateLimitResult) return rateLimitResult;

    const body: ListRequest = await req.json();
    const { action, product_id, buyer_id } = body;

    log.info(`Action: ${action}`);

    // Require authentication
    let producer;
    try {
      producer = await requireAuthenticatedProducer(supabase, req);
    } catch {
      return jsonResponse({ error: "Authorization required" }, 401, corsHeaders);
    }

    // Verify product ownership
    if (product_id) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id, user_id")
        .eq("id", product_id)
        .single();

      if (productError || !product || product.user_id !== producer.id) {
        return jsonResponse({ error: "Product not found or access denied" }, 403, corsHeaders);
      }
    }

    // Route to handlers
    switch (action) {
      case "list":
        if (!product_id) {
          return jsonResponse({ error: "product_id required" }, 400, corsHeaders);
        }
        return handleListStudents(supabase, product_id, {
          page: body.page,
          limit: body.limit,
          search: body.search,
          access_type: body.access_type,
          status: body.status,
          group_id: body.group_id,
        }, corsHeaders);

      case "get":
        if (!buyer_id || !product_id) {
          return jsonResponse({ error: "buyer_id and product_id required" }, 400, corsHeaders);
        }
        return handleGetStudent(supabase, buyer_id, product_id, corsHeaders);

      case "get-producer-info":
        if (!product_id) {
          return jsonResponse({ error: "product_id required" }, 400, corsHeaders);
        }
        return handleGetProducerInfo(supabase, product_id, corsHeaders);

      default:
        return jsonResponse({ error: "Invalid action" }, 400, corsHeaders);
    }

  } catch (error: unknown) {
    log.error("Error:", error);
    return jsonResponse({ error: error instanceof Error ? error.message : "Internal server error" }, 500, corsHeaders);
  }
});
