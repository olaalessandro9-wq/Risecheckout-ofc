/**
 * ============================================================================
 * Key Rotation Executor - Edge Function para Rotação de Chaves
 * ============================================================================
 * 
 * Executa rotação de chaves de criptografia:
 * - Registra nova versão de chave
 * - Re-criptografa dados existentes em batches
 * - Ativa nova versão após conclusão
 * 
 * Endpoints:
 * - POST /key-rotation-executor { action: "status" }
 * - POST /key-rotation-executor { action: "prepare", newVersion: 2 }
 * - POST /key-rotation-executor { action: "rotate", targetVersion: 2 }
 * - POST /key-rotation-executor { action: "activate", version: 2 }
 * 
 * ============================================================================
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import {
  getDefaultKeyProvider,
  decryptWithVersion,
  encryptWithSpecificVersion,
  getEncryptedVersion,
  isEncrypted,
  DEFAULT_ROTATION_CONFIG,
  KeyProvider,
} from "../_shared/kms/index.ts";

const log = createLogger("KeyRotationExecutor");

// ============================================================================
// TYPES
// ============================================================================

// deno-lint-ignore no-explicit-any
type SupabaseClientAny = SupabaseClient<any, any, any>;

interface StatusResponse {
  activeVersion: number;
  availableVersions: number[];
  pendingRotations: RotationStatus[];
}

interface RotationStatus {
  id: string;
  fromVersion: number;
  toVersion: number;
  status: string;
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: string;
  completedAt: string | null;
}

interface KeyVersionRow {
  version: number;
  status: string;
}

interface RotationLogRow {
  id: string;
  from_version: number;
  to_version: number;
  status: string;
  records_processed: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
}

interface ActivateResponse {
  success: boolean;
  error?: string;
}

// ============================================================================
// HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClientAny = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    log.info(`Action: ${action}`);

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

// ============================================================================
// ACTION HANDLERS
// ============================================================================

async function handleStatus(
  supabase: SupabaseClientAny,
  corsHeaders: Record<string, string>
): Promise<Response> {
  const provider = getDefaultKeyProvider();
  const activeVersion = await provider.getActiveVersion();

  // Buscar versões do banco
  const { data: versions } = await supabase
    .from("encryption_key_versions")
    .select("version, status")
    .order("version", { ascending: false }) as { data: KeyVersionRow[] | null };

  // Buscar rotações pendentes
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

async function handlePrepare(
  supabase: SupabaseClientAny,
  body: { newVersion: number; keyIdentifier?: string },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { newVersion, keyIdentifier = `BUYER_ENCRYPTION_KEY_V${newVersion}` } = body;

  if (!newVersion || newVersion < 2) {
    return new Response(
      JSON.stringify({ error: "Invalid version. Must be >= 2" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Verificar se a chave existe no ambiente
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

  // Registrar versão
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

async function handleRotate(
  supabase: SupabaseClientAny,
  body: { targetVersion: number; batchSize?: number },
  corsHeaders: Record<string, string>
): Promise<Response> {
  const { targetVersion, batchSize = DEFAULT_ROTATION_CONFIG.batchSize } = body;
  const provider = getDefaultKeyProvider();
  const fromVersion = await provider.getActiveVersion();

  log.info(`Starting rotation from v${fromVersion} to v${targetVersion}`);

  // Verificar se target version existe
  if (!(await provider.hasVersion(targetVersion))) {
    return new Response(
      JSON.stringify({ error: `Target version ${targetVersion} not available` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Iniciar log de rotação
  const { data: logId } = await supabase.rpc("start_key_rotation_log", {
    p_from_version: fromVersion,
    p_to_version: targetVersion,
  }) as { data: string | null };

  let totalProcessed = 0;
  let totalFailed = 0;

  try {
    // Processar cada tabela configurada
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

      // Atualizar progresso
      await supabase.rpc("update_key_rotation_progress", {
        p_log_id: logId,
        p_processed: totalProcessed,
        p_failed: totalFailed,
      });
    }

    // Completar rotação
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

async function handleActivate(
  supabase: SupabaseClientAny,
  body: { version: number },
  corsHeaders: Record<string, string>
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

// ============================================================================
// TABLE ROTATION
// ============================================================================

interface RotateTableResult {
  processed: number;
  failed: number;
}

async function rotateTable(
  supabase: SupabaseClientAny,
  tableName: string,
  columns: string[],
  primaryKey: string,
  targetVersion: number,
  batchSize: number,
  provider: KeyProvider
): Promise<RotateTableResult> {
  let processed = 0;
  let failed = 0;
  let lastId: string | null = null;

  log.info(`Rotating table: ${tableName}`);

  while (true) {
    // Buscar batch
    let query = supabase
      .from(tableName)
      .select(`${primaryKey}, ${columns.join(", ")}`)
      .order(primaryKey)
      .limit(batchSize);

    if (lastId) {
      query = query.gt(primaryKey, lastId);
    }

    // deno-lint-ignore no-explicit-any
    const { data: rows, error } = await query as { data: any[] | null; error: Error | null };

    if (error) {
      throw new Error(`Error fetching ${tableName}: ${error.message}`);
    }

    if (!rows || rows.length === 0) {
      break; // Fim da tabela
    }

    // Processar cada registro
    for (const row of rows) {
      lastId = row[primaryKey];
      
      try {
        const updates: Record<string, string> = {};
        let needsUpdate = false;

        for (const col of columns) {
          const value = row[col];
          if (!value || !isEncrypted(value)) continue;

          const currentVersion = getEncryptedVersion(value);
          if (currentVersion === null || currentVersion >= targetVersion) continue;

          // Descriptografar e re-criptografar
          const decrypted = await decryptWithVersion(value, provider);
          if (!decrypted.success || !decrypted.decrypted) {
            log.warn(`Failed to decrypt ${tableName}.${col} for ${primaryKey}=${lastId}`);
            failed++;
            continue;
          }

          const encrypted = await encryptWithSpecificVersion(
            decrypted.decrypted,
            targetVersion,
            provider
          );

          if (!encrypted.success || !encrypted.encrypted) {
            log.warn(`Failed to encrypt ${tableName}.${col} for ${primaryKey}=${lastId}`);
            failed++;
            continue;
          }

          updates[col] = encrypted.encrypted;
          needsUpdate = true;
        }

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from(tableName)
            .update(updates)
            .eq(primaryKey, lastId);

          if (updateError) {
            log.warn(`Failed to update ${tableName} ${primaryKey}=${lastId}: ${updateError.message}`);
            failed++;
          } else {
            processed++;
          }
        }

      } catch (rowError) {
        log.warn(`Error processing ${tableName} row: ${rowError}`);
        failed++;
      }
    }

    // Delay entre batches
    await new Promise(resolve => setTimeout(resolve, DEFAULT_ROTATION_CONFIG.delayBetweenBatches));
  }

  log.info(`Table ${tableName}: ${processed} rotated, ${failed} failed`);
  return { processed, failed };
}
