/**
 * ============================================================================
 * Key Rotation Executor - Type Definitions
 * ============================================================================
 * 
 * Centralized type definitions for the Key Rotation Executor module.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// SUPABASE CLIENT TYPE
// ============================================================================

/**
 * Supabase client type for Deno runtime.
 * Using 'any' is accepted here due to Deno/Supabase type incompatibility.
 * @see RISE Protocol V3 - Section 4.6 (Documented External Incompatibilities)
 */
// deno-lint-ignore no-explicit-any
export type SupabaseClientAny = SupabaseClient<any, any, any>;

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface StatusResponse {
  activeVersion: number;
  availableVersions: number[];
  pendingRotations: RotationStatus[];
}

export interface RotationStatus {
  id: string;
  fromVersion: number;
  toVersion: number;
  status: string;
  recordsProcessed: number;
  recordsFailed: number;
  startedAt: string;
  completedAt: string | null;
}

export interface ActivateResponse {
  success: boolean;
  error?: string;
}

export interface RotateTableResult {
  processed: number;
  failed: number;
}

// ============================================================================
// DATABASE ROW TYPES
// ============================================================================

export interface KeyVersionRow {
  version: number;
  status: string;
}

export interface RotationLogRow {
  id: string;
  from_version: number;
  to_version: number;
  status: string;
  records_processed: number;
  records_failed: number;
  started_at: string;
  completed_at: string | null;
}

// ============================================================================
// REQUEST BODY TYPES
// ============================================================================

export interface PrepareRequestBody {
  newVersion: number;
  keyIdentifier?: string;
}

export interface RotateRequestBody {
  targetVersion: number;
  batchSize?: number;
}

export interface ActivateRequestBody {
  version: number;
}

// ============================================================================
// CORS HEADERS TYPE
// ============================================================================

export type CorsHeaders = Record<string, string>;
