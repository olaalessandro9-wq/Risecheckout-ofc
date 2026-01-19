/**
 * ============================================================================
 * Key Rotation Executor - Prepare Handler
 * ============================================================================
 * 
 * Handles the "prepare" action to register a new key version.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createLogger } from "../../_shared/logger.ts";
import type {
  SupabaseClientAny,
  CorsHeaders,
  PrepareRequestBody,
} from "../types.ts";

const log = createLogger("KeyRotationExecutor:Prepare");

/**
 * Handle prepare action - registers a new key version for rotation.
 */
export async function handlePrepare(
  supabase: SupabaseClientAny,
  body: PrepareRequestBody,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const { newVersion, keyIdentifier = `BUYER_ENCRYPTION_KEY_V${newVersion}` } = body;

  if (!newVersion || newVersion < 2) {
    return new Response(
      JSON.stringify({ error: "Invalid version. Must be >= 2" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verify the key exists in environment
  const envVar = `BUYER_ENCRYPTION_KEY_V${newVersion}`;
  if (!Deno.env.get(envVar)) {
    return new Response(
      JSON.stringify({ 
        error: `Secret ${envVar} not configured`,
        hint: `Add the secret ${envVar} in Supabase Edge Functions settings before preparing rotation`
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Register version
  const { error } = await supabase.rpc("register_key_version", {
    p_version: newVersion,
    p_key_identifier: keyIdentifier,
    p_algorithm: "AES-256-GCM",
  });

  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  log.info(`Prepared version ${newVersion}`);

  return new Response(
    JSON.stringify({ success: true, version: newVersion, status: "rotating" }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
