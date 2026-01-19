/**
 * ============================================================================
 * Key Rotation Executor - Activate Handler
 * ============================================================================
 * 
 * Handles the "activate" action to make a key version the active one.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createLogger } from "../../_shared/logger.ts";
import type {
  SupabaseClientAny,
  CorsHeaders,
  ActivateRequestBody,
  ActivateResponse,
} from "../types.ts";

const log = createLogger("KeyRotationExecutor:Activate");

/**
 * Handle activate action - activates a prepared key version.
 */
export async function handleActivate(
  supabase: SupabaseClientAny,
  body: ActivateRequestBody,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const { version } = body;

  const { data, error } = await supabase.rpc("activate_key_version", {
    p_version: version,
  }) as { data: ActivateResponse | null; error: Error | null };

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (data && !data.success) {
    return new Response(
      JSON.stringify({ error: data.error }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  log.info(`Activated version ${version}`);

  return new Response(
    JSON.stringify({ success: true, activatedVersion: version }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
