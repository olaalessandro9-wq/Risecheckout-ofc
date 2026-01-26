/**
 * Data Retention Executor - Type Definitions
 * 
 * RISE Protocol V3 Compliant:
 * - Zero `any` types
 * - Explicit type definitions
 * - Single Responsibility
 * 
 * UPDATED (2026-01-23): Migrated to unified `sessions` table.
 * 
 * @module data-retention-executor/types
 */

/** Valid cleanup categories */
export type CleanupCategory = 
  | 'oauth' 
  | 'sessions' 
  | 'security' 
  | 'gdpr' 
  | 'rate_limit'
  | 'debug'
  | 'all';

/** Valid actions for the executor */
export type CleanupAction = 
  | 'run-all' 
  | 'run-category' 
  | 'dry-run' 
  | 'status';

/** Result from a single table cleanup */
export interface CleanupResult {
  category: string;
  table_name: string;
  rows_deleted: number;
}

/** Result from dry-run preview */
export interface DryRunResult {
  category: string;
  table_name: string;
  rows_to_delete: number;
}

/** Complete execution result */
export interface CleanupExecutionResult {
  success: boolean;
  timestamp: string;
  action: CleanupAction;
  total_rows_deleted: number;
  duration_ms: number;
  results: CleanupResult[];
  errors: string[];
}

/** Dry-run execution result */
export interface DryRunExecutionResult {
  success: boolean;
  timestamp: string;
  action: 'dry-run';
  total_rows_pending: number;
  results: DryRunResult[];
}

/** Incoming request payload */
export interface CleanupRequest {
  action: CleanupAction;
  category?: CleanupCategory;
}

/** Retention policy for documentation */
export interface RetentionPolicy {
  table_name: string;
  category: CleanupCategory;
  retention_period: string;
  criteria: string;
}

/** All retention policies (for status endpoint) */
export const RETENTION_POLICIES: RetentionPolicy[] = [
  { table_name: 'oauth_states', category: 'oauth', retention_period: '1 hour', criteria: 'Expired or used tokens' },
  { table_name: 'sessions', category: 'sessions', retention_period: '7 days after expiry', criteria: 'Expired unified sessions' },
  { table_name: 'vault_access_log', category: 'security', retention_period: '90 days', criteria: 'Old audit logs' },
  { table_name: 'key_rotation_log', category: 'security', retention_period: '365 days', criteria: 'Old rotation logs' },
  { table_name: 'encryption_key_versions', category: 'security', retention_period: 'Keep last 3', criteria: 'Revoked/deprecated keys' },
  { table_name: 'security_events', category: 'security', retention_period: '90 days', criteria: 'Old security events' },
  { table_name: 'gdpr_requests', category: 'gdpr', retention_period: '90 days after processing', criteria: 'Completed/rejected requests' },
  { table_name: 'gdpr_audit_log', category: 'gdpr', retention_period: '365 days', criteria: 'Old GDPR audit logs' },
  { table_name: 'rate_limit_attempts', category: 'rate_limit', retention_period: '24 hours', criteria: 'Old rate limit entries' },
  { table_name: 'buyer_rate_limits', category: 'rate_limit', retention_period: '24 hours', criteria: 'Expired blocks' },
  { table_name: 'trigger_debug_logs', category: 'debug', retention_period: '7 days', criteria: 'Debug logs' },
  { table_name: 'security_audit_log', category: 'debug', retention_period: '90 days', criteria: 'Old audit logs' },
  { table_name: 'checkout_visits', category: 'debug', retention_period: '365 days', criteria: 'Old visit analytics' },
  { table_name: 'webhook_deliveries', category: 'debug', retention_period: '30/90 days', criteria: 'Success/failed deliveries' },
  { table_name: 'gateway_webhook_dlq', category: 'debug', retention_period: '90 days', criteria: 'Resolved/abandoned entries' },
  { table_name: 'order_events', category: 'debug', retention_period: '180 days', criteria: 'Old order events' },
];
