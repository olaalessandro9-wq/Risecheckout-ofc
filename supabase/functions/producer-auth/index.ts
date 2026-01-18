/**
 * producer-auth Edge Function (ROUTER)
 * 
 * RISE Protocol Compliant - Refactored to Router Pattern
 * All logic delegated to _shared handlers
 * 
 * Endpoints:
 * - POST /register - Create new producer account
 * - POST /login - Authenticate producer
 * - POST /logout - Invalidate session
 * - POST /validate - Validate existing session
 * - POST /refresh - Refresh access token using refresh token (PHASE 3)
 * - POST /request-password-reset - Request password reset email
 * - POST /verify-reset-token - Verify reset token validity
 * - POST /reset-password - Reset password with token
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS
import { handleCors } from "../_shared/cors.ts";

// Handlers
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

// PHASE 3: Refresh token handler
import { handleRefresh } from "../_shared/producer-auth-refresh-handler.ts";

// Response helpers
import {
  jsonResponse,
  errorResponse,
} from "../_shared/edge-helpers.ts";

serve(async (req) => {
  // ============================================
  // CORS VALIDATION
  // ============================================
  const corsResult = handleCors(req);
  if (corsResult instanceof Response) {
    return corsResult;
  }
  const corsHeaders = corsResult.headers;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    console.log(`[producer-auth] Action: ${action}, Method: ${req.method}`);

    // ============================================
    // ROUTE TO HANDLERS
    // ============================================
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
    console.error("[producer-auth] Unexpected error:", errorMessage);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
});
