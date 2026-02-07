/**
 * Unified Auth Edge Function
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Single authentication endpoint for the unified identity architecture.
 * Replaces: producer-auth, buyer-auth
 * 
 * Endpoints:
 * - POST /login - Authenticate user
 * - POST /register - Create new account
 * - POST /logout - End session
 * - POST /validate - Validate current session
 * - POST /refresh - Refresh access token
 * - POST /switch-context - Switch active role (producer <-> buyer)
 * - POST /password-reset-request - Request password reset email
 * - POST /password-reset-verify - Verify reset token validity
 * - POST /password-reset - Reset password with token
 * 
 * @module unified-auth
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2, getCorsHeadersV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../_shared/response-helpers.ts";

// Handlers
import { handleLogin } from "./handlers/login.ts";
import { handleRegister } from "./handlers/register.ts";
import { handleLogout } from "./handlers/logout.ts";
import { handleValidate } from "./handlers/validate.ts";
import { handleRefresh } from "./handlers/refresh.ts";
import { handleRequestRefresh } from "./handlers/request-refresh.ts";
import { handleSwitchContext } from "./handlers/switch-context.ts";
import { handlePasswordResetRequest } from "./handlers/password-reset-request.ts";
import { handlePasswordResetVerify } from "./handlers/password-reset-verify.ts";
import { handlePasswordReset } from "./handlers/password-reset.ts";
import { handleCheckProducerBuyer } from "./handlers/check-producer-buyer.ts";
import { handleEnsureProducerAccess } from "./handlers/ensure-producer-access.ts";
import { handleProducerLogin } from "./handlers/producer-login.ts";
import { handleCheckEmail } from "./handlers/check-email.ts";
import { handleVerifyEmail } from "./handlers/verify-email.ts";
import { handleResendVerification } from "./handlers/resend-verification.ts";

const log = createLogger("UnifiedAuth");

serve(async (req: Request): Promise<Response> => {
  // Handle CORS
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) {
    return corsResult; // Blocked origin or preflight
  }
  const corsHeaders = corsResult.headers;
  
  try {
    // Parse URL and extract action
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    const action = pathParts[pathParts.length - 1] || "";
    
    log.info(`Request: ${action}`, { method: req.method });
    
    // Only POST allowed
    if (req.method !== "POST") {
      return errorResponse("Método não permitido", corsHeaders, 405);
    }
    
    // Create Supabase client with general domain key
    const supabase = getSupabaseClient('general');
    
    // Route to appropriate handler
    switch (action) {
      case "login":
        return await handleLogin(supabase, req, corsHeaders);
        
      case "register":
        return await handleRegister(supabase, req, corsHeaders);
        
      case "logout":
        return await handleLogout(supabase, req, corsHeaders);
        
      case "validate":
        return await handleValidate(supabase, req, corsHeaders);
        
      case "refresh":
        return await handleRefresh(supabase, req, corsHeaders);
      
      case "request-refresh":
        return await handleRequestRefresh(supabase, req, corsHeaders);
        
      case "switch-context":
        return await handleSwitchContext(supabase, req, corsHeaders);
        
      case "password-reset-request":
        return await handlePasswordResetRequest(supabase, req, corsHeaders);
        
      case "password-reset-verify":
        return await handlePasswordResetVerify(supabase, req, corsHeaders);
        
      case "password-reset":
        return await handlePasswordReset(supabase, req, corsHeaders);
        
      case "check-producer-buyer":
        return await handleCheckProducerBuyer(supabase, req, corsHeaders);
        
      case "ensure-producer-access":
        return await handleEnsureProducerAccess(supabase, req, corsHeaders);
        
      case "producer-login":
        return await handleProducerLogin(supabase, req, corsHeaders);
        
      case "check-email":
        return await handleCheckEmail(supabase, req, corsHeaders);
        
      case "verify-email":
        return await handleVerifyEmail(supabase, req, corsHeaders);
        
      case "resend-verification":
        return await handleResendVerification(supabase, req, corsHeaders);
        
      default:
        log.warn(`Unknown action: ${action}`);
        return errorResponse(`Ação desconhecida: ${action}`, corsHeaders, 404);
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    log.error("Unhandled error:", msg);
    return errorResponse("Erro interno do servidor", corsHeaders, 500);
  }
});
