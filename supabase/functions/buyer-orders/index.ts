/**
 * buyer-orders Edge Function
 * 
 * Router for buyer order and access management.
 * 
 * Actions:
 * - orders: List buyer orders
 * - access: List products with access
 * - content: Get product content (with drip verification)
 * - profile: Get buyer profile
 * 
 * @version 3.0.0 - RISE Protocol V3 Compliance (Modular Router + Handlers)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import {
  rateLimitMiddleware,
  RATE_LIMIT_CONFIGS,
  getClientIP,
} from "../_shared/rate-limiting/index.ts";
import { unauthorizedResponse } from "../_shared/unified-auth-v2.ts";
import { createLogger } from "../_shared/logger.ts";

import { validateSession } from "./helpers/session.ts";
import { handleOrders } from "./handlers/orders.ts";
import { handleAccess } from "./handlers/access.ts";
import { handleContent } from "./handlers/content.ts";
import { handleProfile } from "./handlers/profile.ts";

const log = createLogger("buyer-orders");

serve(async (req) => {
  // CORS handling (V2 - environment-aware)
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Rate limiting
    const rateLimitResult = await rateLimitMiddleware(
      supabase,
      req,
      RATE_LIMIT_CONFIGS.MEMBERS_AREA,
      corsHeaders
    );
    if (rateLimitResult) {
      log.warn(`Rate limit exceeded for IP: ${getClientIP(req)}`);
      return rateLimitResult;
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1];

    // Validate session (unified auth only)
    const buyer = await validateSession(supabase, req);

    if (!buyer) {
      return unauthorizedResponse(corsHeaders);
    }

    log.debug(`Action: ${action}, Buyer: ${buyer.email}`);

    // Route to handlers
    switch (action) {
      case "orders":
        if (req.method === "GET") {
          return handleOrders(supabase, buyer, corsHeaders);
        }
        break;

      case "access":
        if (req.method === "GET") {
          return handleAccess(supabase, buyer, corsHeaders);
        }
        break;

      case "content":
        if (req.method === "GET") {
          const productId = url.searchParams.get("productId");
          // RISE V3: Extract viewport from query param (default: desktop)
          const viewportParam = url.searchParams.get("viewport");
          const viewport: 'desktop' | 'mobile' = viewportParam === 'mobile' ? 'mobile' : 'desktop';
          
          if (!productId) {
            return new Response(
              JSON.stringify({ error: "productId é obrigatório" }),
              { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
          return handleContent(supabase, buyer, productId, viewport, corsHeaders);
        }
        break;

      case "profile":
        if (req.method === "GET") {
          return handleProfile(supabase, buyer, corsHeaders);
        }
        break;
    }

    return new Response(
      JSON.stringify({ error: "Ação não encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    log.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
