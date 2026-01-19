/**
 * Data Retention Executor - Cleanup Handler
 * 
 * RISE Protocol V3 Compliant:
 * - Single Responsibility: Only handles cleanup execution
 * - Zero `any` types (except Supabase RPC response)
 * - Proper error handling
 * 
 * @module data-retention-executor/handlers/execute-cleanup
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { 
  CleanupCategory, 
  CleanupResult, 
  CleanupExecutionResult,
  DryRunResult,
  DryRunExecutionResult 
} from '../types.ts';

/** Creates Supabase admin client */
function createAdminClient(): SupabaseClient {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

/** Execute full cleanup via cleanup_all_data_v2_with_log() */
export async function executeFullCleanup(): Promise<CleanupExecutionResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  const results: CleanupResult[] = [];

  try {
    // First get the results from cleanup_all_data_v2
    const { data, error } = await supabase.rpc('cleanup_all_data_v2');
    
    if (error) {
      errors.push(`RPC error: ${error.message}`);
    } else if (data) {
      // deno-lint-ignore no-explicit-any
      (data as any[]).forEach((row: { category: string; table_name: string; rows_deleted: number }) => {
        results.push({
          category: row.category,
          table_name: row.table_name,
          rows_deleted: Number(row.rows_deleted),
        });
      });
    }

    // Also run the logging function
    const { error: logError } = await supabase.rpc('cleanup_all_data_v2_with_log');
    if (logError) {
      errors.push(`Logging error: ${logError.message}`);
    }

  } catch (e) {
    errors.push(`Exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  const totalDeleted = results.reduce((sum, r) => sum + r.rows_deleted, 0);

  return {
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    action: 'run-all',
    total_rows_deleted: totalDeleted,
    duration_ms: Date.now() - startTime,
    results,
    errors,
  };
}

/** Execute cleanup for a specific category */
export async function executeCategoryCleanup(category: CleanupCategory): Promise<CleanupExecutionResult> {
  const startTime = Date.now();
  const supabase = createAdminClient();
  const errors: string[] = [];
  const results: CleanupResult[] = [];

  try {
    const { data, error } = await supabase.rpc('cleanup_by_category', { p_category: category });
    
    if (error) {
      errors.push(`RPC error: ${error.message}`);
    } else if (data) {
      // deno-lint-ignore no-explicit-any
      (data as any[]).forEach((row: { table_name: string; rows_deleted: number }) => {
        results.push({
          category,
          table_name: row.table_name,
          rows_deleted: Number(row.rows_deleted),
        });
      });
    }
  } catch (e) {
    errors.push(`Exception: ${e instanceof Error ? e.message : String(e)}`);
  }

  const totalDeleted = results.reduce((sum, r) => sum + r.rows_deleted, 0);

  return {
    success: errors.length === 0,
    timestamp: new Date().toISOString(),
    action: 'run-category',
    total_rows_deleted: totalDeleted,
    duration_ms: Date.now() - startTime,
    results,
    errors,
  };
}

/** Execute dry-run to preview what would be deleted */
export async function executeDryRun(): Promise<DryRunExecutionResult> {
  const supabase = createAdminClient();
  const results: DryRunResult[] = [];

  try {
    const { data, error } = await supabase.rpc('cleanup_dry_run');
    
    if (error) {
      return {
        success: false,
        timestamp: new Date().toISOString(),
        action: 'dry-run',
        total_rows_pending: 0,
        results: [],
      };
    }

    if (data) {
      // deno-lint-ignore no-explicit-any
      (data as any[]).forEach((row: { category: string; table_name: string; rows_to_delete: number }) => {
        results.push({
          category: row.category,
          table_name: row.table_name,
          rows_to_delete: Number(row.rows_to_delete),
        });
      });
    }
  } catch (_e) {
    return {
      success: false,
      timestamp: new Date().toISOString(),
      action: 'dry-run',
      total_rows_pending: 0,
      results: [],
    };
  }

  const totalPending = results.reduce((sum, r) => sum + r.rows_to_delete, 0);

  return {
    success: true,
    timestamp: new Date().toISOString(),
    action: 'dry-run',
    total_rows_pending: totalPending,
    results,
  };
}
