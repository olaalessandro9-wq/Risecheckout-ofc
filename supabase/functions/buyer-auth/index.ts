/**
 * buyer-auth Edge Function
 * 
 * Router principal para autenticação de buyers.
 * Handlers extraídos para _shared/ para manter < 300 linhas.
 * 
 * SECURITY UPDATES:
 * - VULN-002: Rate limiting para login/register
 * - VULN-007: Política de senhas forte
 * - VULN-006: Sanitização de inputs
 * - Password Reset Flow with email
 * - PHASE 3: Refresh token support
 * 
 * @refactored 2026-01-13 - Handlers extraídos para _shared/buyer-auth-handlers.ts
 * @updated 2026-01-18 - PHASE 3: Added refresh token endpoint
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

// Import handlers - Core (register, login, logout)
import {
  handleRegister,
  handleLogin,
  handleLogout,
} from "../_shared/buyer-auth-handlers.ts";

// Import handlers - Extended (validate, check-email, password reset)
import {
  handleValidate,
  handleCheckEmail,
  handleRequestPasswordReset,
  handleVerifyResetToken,
  handleResetPassword,
} from "../_shared/buyer-auth-handlers-extended.ts";

// Import handlers - Producer (check-producer-buyer, ensure-producer-access, producer-login)
import {
  handleCheckProducerBuyer,
  handleEnsureProducerAccess,
  handleProducerLogin,
} from "../_shared/buyer-auth-producer-handlers.ts";

// PHASE 3: Refresh token handler
import { handleRefresh } from "../_shared/buyer-auth-refresh-handler.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.pathname.split("/").pop();

    console.log(`[buyer-auth] Action: ${action}`);

    // ============================================
    // ROUTE TO HANDLERS
    // ============================================
    
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

    // PHASE 3: Refresh token endpoint
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

    // ============================================
    // 404 - ACTION NOT FOUND
    // ============================================
    return new Response(
      JSON.stringify({ error: "Ação não encontrada" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[buyer-auth] Unexpected error:", errorMessage);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
