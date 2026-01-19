/**
 * ============================================================================
 * Key Rotation Executor - Status Handler
 * ============================================================================
 * 
 * Handles the "status" action to get current key rotation state.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { getDefaultKeyProvider } from "../../_shared/kms/index.ts";
import type {
  SupabaseClientAny,
  CorsHeaders,
  StatusResponse,
  KeyVersionRow,
  RotationLogRow,
} from "../types.ts";

/**
 * Handle status action - returns current key rotation state.
 */
export async function handleStatus(
  supabase: SupabaseClientAny,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const provider = getDefaultKeyProvider();
  const activeVersion = await provider.getActiveVersion();

  // Fetch versions from database
  const { data: versions } = await supabase
    .from("encryption_key_versions")
    .select("version, status")
    .order("version", { ascending: false }) as { data: KeyVersionRow[] | null };

  // Fetch pending rotations
  const { data: rotations } = await supabase
    .from("key_rotation_log")
    .select("*")
    .in("status", ["running"])
    .order("started_at", { ascending: false }) as { data: RotationLogRow[] | null };

  const response: StatusResponse = {
    activeVersion,
    availableVersions: (versions || []).map((v: KeyVersionRow) => v.version),
    pendingRotations: (rotations || []).map((r: RotationLogRow) => ({
      id: r.id,
      fromVersion: r.from_version,
      toVersion: r.to_version,
      status: r.status,
      recordsProcessed: r.records_processed,
      recordsFailed: r.records_failed,
      startedAt: r.started_at,
      completedAt: r.completed_at,
    })),
  };

  return new Response(
    JSON.stringify({ success: true, ...response }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
