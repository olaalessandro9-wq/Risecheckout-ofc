/**
 * producer-auth Edge Function (ROUTER)
 * 
 * RISE Protocol V3 - TRANSITION MODE
 * 
 * Maintains backwards compatibility while internally using
 * the unified auth system (sessions table, users table).
 * 
 * @deprecated Use unified-auth directly for new code.
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { errorResponse } from "../_shared/edge-helpers.ts";

const log = createLogger("producer-auth");

import {
  handleRegister,
  handleLogin,
  handleLogout,
  handleValidate,
} from "../_shared/producer-auth-handlers.ts";

import {
  handleRequestPasswordReset,
  handleVerifyResetToken,
  handleResetPassword,
} from "../_shared/producer-auth-reset-handlers.ts";

import { handleRefresh } from "../_shared/producer-auth-refresh-handler.ts";

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

    log.info(`Action: ${action}, Method: ${req.method}`);

    if (req.method !== "POST") {
      return errorResponse("Método não permitido", corsHeaders, 405);
    }

    switch (action) {
      case "register":
        return handleRegister(supabase, req, corsHeaders);
      case "login":
        return handleLogin(supabase, req, corsHeaders);
      case "logout":
        return handleLogout(supabase, req, corsHeaders);
      case "validate":
        return handleValidate(supabase, req, corsHeaders);
      case "refresh":
        return handleRefresh(supabase, req, corsHeaders);
      case "request-password-reset":
        return handleRequestPasswordReset(supabase, req, corsHeaders);
      case "verify-reset-token":
        return handleVerifyResetToken(supabase, req, corsHeaders);
      case "reset-password":
        return handleResetPassword(supabase, req, corsHeaders);
      default:
        return errorResponse(`Ação não encontrada: ${action}`, corsHeaders, 404);
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error("Unexpected error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
});
