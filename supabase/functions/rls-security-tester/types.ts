/**
 * ============================================================================
 * RLS Security Tester - Type Definitions
 * ============================================================================
 * 
 * Centralized type definitions for the RLS Security Test Framework.
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
// TEST ENUMS & CONSTANTS
// ============================================================================

export type TestSeverity = 'critical' | 'high' | 'medium' | 'low';
export type TestStatus = 'passed' | 'failed' | 'warning' | 'skipped';

export type TestCategory = 
  | 'RLS_ENABLED' 
  | 'CRITICAL_TABLES' 
  | 'POLICY_COVERAGE' 
  | 'IDOR_SIMULATION'
  | 'SERVICE_ROLE_ONLY';

// ============================================================================
// TEST RESULT TYPES
// ============================================================================

export interface TestDetails {
  expectedBehavior: string;
  actualBehavior: string;
  sqlQuery?: string;
  recommendation?: string;
}

export interface RlsTestResult {
  testName: string;
  category: TestCategory;
  tableName: string;
  status: TestStatus;
  severity: TestSeverity;
  message: string;
  details: TestDetails;
  durationMs: number;
}

export interface OperationCoverage {
  select: boolean;
  insert: boolean;
  update: boolean;
  delete: boolean;
}

export interface CriticalTableStatus {
  tableName: string;
  hasRls: boolean;
  policyCount: number;
  operations: OperationCoverage;
}

export interface TestSummary {
  tablesWithoutRls: string[];
  tablesWithoutPolicies: string[];
  criticalTablesStatus: CriticalTableStatus[];
  recommendations: string[];
}

export interface RlsTestSuiteResult {
  success: boolean;
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  criticalFailures: number;
  durationMs: number;
  tests: RlsTestResult[];
  summary: TestSummary;
}

// ============================================================================
// DATABASE QUERY RESULT TYPES
// ============================================================================

export interface RlsStatusRow {
  tablename: string;
  has_rls: boolean;
}

export interface PolicyRow {
  tablename: string;
  policyname: string;
  cmd: string;
  permissive: string;
  roles: string[];
  qual: string | null;
  with_check: string | null;
}

export interface PolicyCoverageRow {
  tablename: string;
  select_policies: number;
  insert_policies: number;
  update_policies: number;
  delete_policies: number;
}

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

export interface TestRequest {
  action: 'run-all' | 'run-category' | 'run-single';
  category?: TestCategory;
  testName?: string;
}

export type CorsHeaders = Record<string, string>;

// ============================================================================
// CRITICAL TABLES CONFIGURATION
// ============================================================================

/**
 * Tables that MUST have RLS enabled and proper policies.
 * Ordered by criticality.
 * 
 * RISE V3: Using unified `sessions` table instead of legacy buyer_sessions
 */
export const CRITICAL_TABLES = [
  // Financial & Orders
  'orders',
  'order_items',
  'order_bumps',
  
  // Authentication & Sessions (RISE V3 Unified)
  'sessions',
  'users',
  'buyer_saved_cards',
  
  // Security & Audit
  'vault_access_log',
  'encryption_key_versions',
  'key_rotation_log',
  'security_audit_log',
  
  // Sensitive Data
  'affiliates',
  'affiliate_audit_log',
  'gateway_webhook_dlq',
  
  // Products & Access
  'products',
  'offers',
  'buyer_product_access',
  'buyer_content_access',
] as const;

/**
 * Tables that should ONLY be accessible by service_role.
 * These tables use DENY-ALL policies (qual:false or with_check:false)
 * that block all non-service_role access.
 * 
 * NOTE: vault_access_log, encryption_key_versions, key_rotation_log
 * are protected by proper deny-all policies but use {public} role with
 * false expressions. The test framework correctly identifies them as secure.
 * 
 * Tables tested here use "ALL for service_role" pattern.
 */
export const SERVICE_ROLE_ONLY_TABLES = [
  'gateway_webhook_dlq',
  'gdpr_audit_log',
  'gdpr_requests',
] as const;
