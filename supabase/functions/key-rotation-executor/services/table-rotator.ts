/**
 * ============================================================================
 * Key Rotation Executor - Table Rotator Service
 * ============================================================================
 * 
 * Service responsible for rotating encryption keys in a single table.
 * Processes records in batches to avoid memory issues.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createLogger } from "../../_shared/logger.ts";
import {
  decryptWithVersion,
  encryptWithSpecificVersion,
  getEncryptedVersion,
  isEncrypted,
  DEFAULT_ROTATION_CONFIG,
  KeyProvider,
} from "../../_shared/kms/index.ts";
import type { SupabaseClientAny, RotateTableResult } from "../types.ts";

const log = createLogger("KeyRotationExecutor:TableRotator");

/**
 * Rotate all encrypted columns in a table to a new key version.
 */
export async function rotateTable(
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
    // Fetch batch
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
      break; // End of table
    }

    // Process each record
    for (const row of rows) {
      lastId = row[primaryKey];
      
      const result = await processRow(
        supabase,
        tableName,
        primaryKey,
        row,
        columns,
        targetVersion,
        provider
      );

      processed += result.processed;
      failed += result.failed;
    }

    // Delay between batches
    await new Promise(resolve => setTimeout(resolve, DEFAULT_ROTATION_CONFIG.delayBetweenBatches));
  }

  log.info(`Table ${tableName}: ${processed} rotated, ${failed} failed`);
  return { processed, failed };
}

/**
 * Process a single row, re-encrypting all encrypted columns.
 */
async function processRow(
  supabase: SupabaseClientAny,
  tableName: string,
  primaryKey: string,
  // deno-lint-ignore no-explicit-any
  row: any,
  columns: string[],
  targetVersion: number,
  provider: KeyProvider
): Promise<RotateTableResult> {
  let processed = 0;
  let failed = 0;
  const rowId = row[primaryKey];

  try {
    const updates: Record<string, string> = {};
    let needsUpdate = false;

    for (const col of columns) {
      const value = row[col];
      if (!value || !isEncrypted(value)) continue;

      const currentVersion = getEncryptedVersion(value);
      if (currentVersion === null || currentVersion >= targetVersion) continue;

      // Decrypt and re-encrypt
      const decrypted = await decryptWithVersion(value, provider);
      if (!decrypted.success || !decrypted.decrypted) {
        log.warn(`Failed to decrypt ${tableName}.${col} for ${primaryKey}=${rowId}`);
        failed++;
        continue;
      }

      const encrypted = await encryptWithSpecificVersion(
        decrypted.decrypted,
        targetVersion,
        provider
      );

      if (!encrypted.success || !encrypted.encrypted) {
        log.warn(`Failed to encrypt ${tableName}.${col} for ${primaryKey}=${rowId}`);
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
        .eq(primaryKey, rowId);

      if (updateError) {
        log.warn(`Failed to update ${tableName} ${primaryKey}=${rowId}: ${updateError.message}`);
        failed++;
      } else {
        processed++;
      }
    }

  } catch (rowError) {
    log.warn(`Error processing ${tableName} row: ${rowError}`);
    failed++;
  }

  return { processed, failed };
}
