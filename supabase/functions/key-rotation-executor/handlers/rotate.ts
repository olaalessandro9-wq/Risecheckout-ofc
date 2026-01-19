/**
 * ============================================================================
 * Key Rotation Executor - Rotate Handler
 * ============================================================================
 * 
 * Handles the "rotate" action to re-encrypt data with a new key version.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createLogger } from "../../_shared/logger.ts";
import {
  getDefaultKeyProvider,
  DEFAULT_ROTATION_CONFIG,
} from "../../_shared/kms/index.ts";
import { rotateTable } from "../services/table-rotator.ts";
import type {
  SupabaseClientAny,
  CorsHeaders,
  RotateRequestBody,
} from "../types.ts";

const log = createLogger("KeyRotationExecutor:Rotate");

/**
 * Handle rotate action - re-encrypts all data with the target key version.
 */
export async function handleRotate(
  supabase: SupabaseClientAny,
  body: RotateRequestBody,
  corsHeaders: CorsHeaders
): Promise<Response> {
  const { targetVersion, batchSize = DEFAULT_ROTATION_CONFIG.batchSize } = body;
  const provider = getDefaultKeyProvider();
  const fromVersion = await provider.getActiveVersion();

  log.info(`Starting rotation from v${fromVersion} to v${targetVersion}`);

  // Verify target version exists
  if (!(await provider.hasVersion(targetVersion))) {
    return new Response(
      JSON.stringify({ error: `Target version ${targetVersion} not available` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Start rotation log
  const { data: logId } = await supabase.rpc("start_key_rotation_log", {
    p_from_version: fromVersion,
    p_to_version: targetVersion,
  }) as { data: string | null };

  let totalProcessed = 0;
  let totalFailed = 0;

  try {
    // Process each configured table
    for (const tableConfig of DEFAULT_ROTATION_CONFIG.tables) {
      const result = await rotateTable(
        supabase,
        tableConfig.tableName,
        tableConfig.encryptedColumns,
        tableConfig.primaryKey,
        targetVersion,
        batchSize,
        provider
      );
      
      totalProcessed += result.processed;
      totalFailed += result.failed;

      // Update progress
      await supabase.rpc("update_key_rotation_progress", {
        p_log_id: logId,
        p_processed: totalProcessed,
        p_failed: totalFailed,
      });
    }

    // Complete rotation
    await supabase.rpc("complete_key_rotation", {
      p_log_id: logId,
      p_success: true,
      p_error: null,
    });

    log.info(`Rotation completed: ${totalProcessed} processed, ${totalFailed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        recordsProcessed: totalProcessed,
        recordsFailed: totalFailed,
        message: totalFailed === 0 
          ? "Rotation completed successfully. Run 'activate' to finalize."
          : "Rotation completed with errors. Review before activating.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    
    await supabase.rpc("complete_key_rotation", {
      p_log_id: logId,
      p_success: false,
      p_error: errorMessage,
    });

    return new Response(
      JSON.stringify({ error: errorMessage, recordsProcessed: totalProcessed }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}
