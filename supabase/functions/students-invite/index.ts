/**
 * students-invite Edge Function - Router
 * RISE Protocol V3 Compliant - Pure Router Pattern
 * 
 * @version 4.0.0 - Modular Architecture
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { rateLimitMiddleware, MEMBERS_AREA } from "../_shared/rate-limiting/index.ts";
import { requireAuthenticatedProducer } from "../_shared/unified-auth.ts";
import { createLogger } from "../_shared/logger.ts";

import type { InviteRequest } from "./types.ts";
import { jsonResponse } from "./helpers/response.ts";
import { handleValidateInviteToken } from "./handlers/validate_invite_token.ts";
import { handleUseInviteToken } from "./handlers/use_invite_token.ts";
import { handleGeneratePurchaseAccess } from "./handlers/generate_purchase_access.ts";
import { handleInvite } from "./handlers/invite.ts";

const log = createLogger("students-invite");

Deno.serve(async (req) => {
  // RISE V3: Use handleCorsV2 for ALL actions (including public ones)
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  let body: InviteRequest;
  
  // Parse body
  try {
    const clonedReq = req.clone();
    body = await clonedReq.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body" }, 400, corsHeaders);
  }
  
  const { action } = body;
  
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const rateLimitResult = await rateLimitMiddleware(supabase, req, MEMBERS_AREA, corsHeaders);
    if (rateLimitResult) return rateLimitResult;

    log.info(`Action: ${action}`);

    // Route to handlers
    switch (action) {
      case "validate-invite-token":
        return handleValidateInviteToken(supabase, body.token, corsHeaders);

      case "use-invite-token":
        return handleUseInviteToken(supabase, body.token, body.password, req, corsHeaders);

      case "generate-purchase-access":
        return handleGeneratePurchaseAccess(supabase, body.order_id, body.customer_email, body.product_id, corsHeaders);

      case "invite": {
        let producer;
        try {
          producer = await requireAuthenticatedProducer(supabase, req);
        } catch {
          return jsonResponse({ error: "Authorization required" }, 401, corsHeaders);
        }
        return handleInvite(supabase, producer.id, body.product_id, body.email, body.name, body.group_ids, corsHeaders);
      }

      default:
        return jsonResponse({ error: "Invalid action" }, 400, corsHeaders);
    }

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    log.error("Error:", message);
    return jsonResponse({ error: message }, 500, corsHeaders);
  }
});
