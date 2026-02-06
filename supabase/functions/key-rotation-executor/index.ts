/**
 * ============================================================================
 * Key Rotation Executor - Edge Function Router
 * ============================================================================
 * 
 * Modular router for key rotation operations.
 * 
 * Endpoints:
 * - POST { action: "status" }   - Get current rotation status
 * - POST { action: "prepare" }  - Register new key version
 * - POST { action: "rotate" }   - Re-encrypt data with new key
 * - POST { action: "activate" } - Activate new key version
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant (Modularized)
 * ============================================================================
 */

import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import type { SupabaseClientAny } from "./types.ts";

// Import handlers
import { handleStatus } from "./handlers/status.ts";
import { handlePrepare } from "./handlers/prepare.ts";
import { handleRotate } from "./handlers/rotate.ts";
import { handleActivate } from "./handlers/activate.ts";

const log = createLogger("KeyRotationExecutor");

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  // Validate method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Initialize Supabase client with admin domain key
    const supabase: SupabaseClientAny = getSupabaseClient('admin');

    // Parse request
    const body = await req.json();
    const { action } = body;

    log.info(`Action: ${action}`);

    // Route to handler
    switch (action) {
      case "status":
        return await handleStatus(supabase, corsHeaders);
      
      case "prepare":
        return await handlePrepare(supabase, body, corsHeaders);
      
      case "rotate":
        return await handleRotate(supabase, body, corsHeaders);
      
      case "activate":
        return await handleActivate(supabase, body, corsHeaders);
      
      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error(`Exception: ${errorMessage}`);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
