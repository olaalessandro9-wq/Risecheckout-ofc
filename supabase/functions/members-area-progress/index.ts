/**
 * members-area-progress - Router
 * RISE Protocol V3 Compliant - Pure Router Pattern
 * 
 * @version 4.0.0 - Modular Architecture
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, MEMBERS_AREA, getClientIP } from "../_shared/rate-limiting/index.ts";
import { createLogger } from "../_shared/logger.ts";
import { getAuthenticatedUser } from "../_shared/unified-auth-v2.ts";
import { errorResponse, unauthorizedResponse, serverErrorResponse } from "../_shared/response-helpers.ts";
import type { ProgressRequest } from "./types.ts";

// Handlers
import { handleGetContent } from "./handlers/get_content.ts";
import { handleGetSummary } from "./handlers/get_summary.ts";
import { handleGetLastWatched } from "./handlers/get_last_watched.ts";
import { handleUpdate } from "./handlers/update.ts";
import { handleComplete } from "./handlers/complete.ts";
import { handleUncomplete } from "./handlers/uncomplete.ts";
import { handleGetModuleProgress } from "./handlers/get_module_progress.ts";
import { handleGetProductProgress } from "./handlers/get_product_progress.ts";

const log = createLogger("members-area-progress");

Deno.serve(async (req) => {
  // CORS V2 handler
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(supabase, req, MEMBERS_AREA, corsHeaders);
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const body: ProgressRequest = await req.json();
    const { action, content_id, module_id, product_id, data } = body;

    log.info(`Action: ${action}`);

    // RISE V3: Unified auth via cookie __Secure-rise_access (Domain=.risecheckout.com)
    const user = await getAuthenticatedUser(supabase, req);
    if (!user) {
      return unauthorizedResponse(corsHeaders, "Authentication required");
    }

    const buyerId = user.id;

    // Route to handlers
    switch (action) {
      case "get_content":
      case "get":
        return handleGetContent(supabase, buyerId, content_id, corsHeaders);

      case "get_summary":
        return handleGetSummary(supabase, buyerId, product_id, corsHeaders);

      case "get_last_watched":
        return handleGetLastWatched(supabase, buyerId, product_id, corsHeaders);

      case "update":
        return handleUpdate(supabase, buyerId, content_id, data, corsHeaders);

      case "complete":
        return handleComplete(supabase, buyerId, content_id, corsHeaders);

      case "uncomplete":
        return handleUncomplete(supabase, buyerId, content_id, corsHeaders);

      case "get-module-progress":
        return handleGetModuleProgress(supabase, buyerId, module_id, corsHeaders);

      case "get-product-progress":
        return handleGetProductProgress(supabase, buyerId, product_id, corsHeaders);

      default:
        return errorResponse("Invalid action", corsHeaders, 400);
    }
  } catch (error: unknown) {
    log.error("Error:", error);
    return serverErrorResponse(corsHeaders, error instanceof Error ? error.message : "Internal server error");
  }
});
