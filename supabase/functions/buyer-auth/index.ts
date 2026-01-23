/**
 * buyer-auth Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - TRANSITION MODE
 * 
 * This function maintains backwards compatibility while internally
 * using the unified auth system (sessions table, users table).
 * 
 * @note All core auth endpoints now use unified-auth handlers.
 * @deprecated Use unified-auth directly for new code.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("buyer-auth");

// Core handlers - still using legacy but writing to unified tables
import {
  handleRegister,
  handleLogin,
  handleLogout,
} from "../_shared/buyer-auth-handlers.ts";

import {
  handleValidate,
  handleCheckEmail,
  handleRequestPasswordReset,
  handleVerifyResetToken,
  handleResetPassword,
} from "../_shared/buyer-auth-handlers-extended.ts";

import {
  handleCheckProducerBuyer,
  handleEnsureProducerAccess,
  handleProducerLogin,
} from "../_shared/buyer-auth-producer-handlers.ts";

import { handleRefresh } from "../_shared/buyer-auth-refresh-handler.ts";

serve(async (req) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    log.info(`Action: ${action}`);

    if (action === "register" && req.method === "POST") {
      return handleRegister(supabase, req, corsHeaders);
    }
    if (action === "login" && req.method === "POST") {
      return handleLogin(supabase, req, corsHeaders);
    }
    if (action === "logout" && req.method === "POST") {
      return handleLogout(supabase, req, corsHeaders);
    }
    if (action === "validate" && req.method === "POST") {
      return handleValidate(supabase, req, corsHeaders);
    }
    if (action === "refresh" && req.method === "POST") {
      return handleRefresh(supabase, req, corsHeaders);
    }
    if (action === "check-email" && req.method === "POST") {
      return handleCheckEmail(supabase, req, corsHeaders);
    }
    if (action === "request-password-reset" && req.method === "POST") {
      return handleRequestPasswordReset(supabase, req, corsHeaders);
    }
    if (action === "verify-reset-token" && req.method === "POST") {
      return handleVerifyResetToken(supabase, req, corsHeaders);
    }
    if (action === "reset-password" && req.method === "POST") {
      return handleResetPassword(supabase, req, corsHeaders);
    }
    if (action === "check-producer-buyer" && req.method === "POST") {
      return handleCheckProducerBuyer(supabase, req, corsHeaders);
    }
    if (action === "ensure-producer-access" && req.method === "POST") {
      return handleEnsureProducerAccess(supabase, req, corsHeaders);
    }
    if (action === "producer-login" && req.method === "POST") {
      return handleProducerLogin(supabase, req, corsHeaders);
    }

    return new Response(
      JSON.stringify({ error: "Ação não encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
