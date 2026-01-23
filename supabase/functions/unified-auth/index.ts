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
 * - POST /password-reset-request - Request password reset
 * - POST /password-reset - Reset password with token
 * 
 * @module unified-auth
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { jsonResponse, errorResponse } from "../_shared/response-helpers.ts";

// Handlers
import { handleLogin } from "./handlers/login.ts";
import { handleRegister } from "./handlers/register.ts";
import { handleLogout } from "./handlers/logout.ts";
import { handleValidate } from "./handlers/validate.ts";
import { handleRefresh } from "./handlers/refresh.ts";
import { handleSwitchContext } from "./handlers/switch-context.ts";

const log = createLogger("UnifiedAuth");

serve(async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  
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
    
    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseKey) {
      log.error("Missing Supabase configuration");
      return errorResponse("Configuração do servidor incorreta", corsHeaders, 500);
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
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
        
      case "switch-context":
        return await handleSwitchContext(supabase, req, corsHeaders);
        
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
