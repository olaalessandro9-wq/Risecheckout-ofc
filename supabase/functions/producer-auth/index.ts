/**
 * producer-auth Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - PROXY MODE
 * 
 * This function is a PURE PROXY to unified-auth.
 * All requests are forwarded to the unified authentication system.
 * 
 * @deprecated Use unified-auth directly for new code.
 * @migration This proxy will be removed after 30 days of stable operation.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { errorResponse } from "../_shared/response-helpers.ts";

const log = createLogger("producer-auth-proxy");

// Action mapping from legacy producer-auth to unified-auth
const ACTION_MAP: Record<string, string> = {
  "login": "login",
  "register": "register",
  "logout": "logout",
  "validate": "validate",
  "refresh": "refresh",
  "request-password-reset": "password-reset-request",
  "verify-reset-token": "password-reset-verify",
  "reset-password": "password-reset",
};

serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const url = new URL(req.url);
    const action = url.pathname.split("/").pop() || "";

    log.info(`[PROXY] Received: ${action}`);

    // Map to unified-auth action
    const unifiedAction = ACTION_MAP[action];
    if (!unifiedAction) {
      log.warn(`[PROXY] Unknown action: ${action}`);
      return errorResponse("Ação não encontrada", corsHeaders, 404);
    }

    // Build unified-auth URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      return errorResponse("Configuração do servidor incorreta", corsHeaders, 500);
    }
    const unifiedUrl = `${supabaseUrl}/functions/v1/unified-auth/${unifiedAction}`;

    // Clone request body
    let body: string | null = null;
    if (req.method === "POST") {
      const originalBody = await req.json();
      
      // For login/register, inject preferredRole = "user" (producer context)
      if (["login", "register"].includes(unifiedAction)) {
        originalBody.preferredRole = "user";
      }
      
      body = JSON.stringify(originalBody);
    }

    // Forward to unified-auth with all original headers
    const forwardHeaders = new Headers();
    forwardHeaders.set("Content-Type", "application/json");
    
    // Forward cookies (critical for httpOnly auth)
    const cookies = req.headers.get("cookie");
    if (cookies) {
      forwardHeaders.set("cookie", cookies);
    }
    
    // Forward IP for rate limiting
    const xForwardedFor = req.headers.get("x-forwarded-for");
    if (xForwardedFor) {
      forwardHeaders.set("x-forwarded-for", xForwardedFor);
    }
    
    // Forward user agent
    const userAgent = req.headers.get("user-agent");
    if (userAgent) {
      forwardHeaders.set("user-agent", userAgent);
    }

    // Service role key for internal call
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (serviceKey) {
      forwardHeaders.set("Authorization", `Bearer ${serviceKey}`);
    }

    log.info(`[PROXY] Forwarding to: ${unifiedUrl}`);

    const response = await fetch(unifiedUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body,
    });

    // Forward response with all headers (including Set-Cookie)
    const responseHeaders = new Headers(corsHeaders);
    
    // Forward Set-Cookie headers from unified-auth
    const setCookies = response.headers.getSetCookie?.() || [];
    setCookies.forEach((cookie: string) => {
      responseHeaders.append("Set-Cookie", cookie);
    });
    
    responseHeaders.set("Content-Type", "application/json");

    const responseBody = await response.text();
    
    log.info(`[PROXY] Response: ${response.status}`);

    return new Response(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("[PROXY] Error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
});
