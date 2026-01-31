/**
 * Shared Types & Helpers for data-retention-executor Tests
 * 
 * @module data-retention-executor/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
// ============================================================================

export type CleanupCategory = 
  | 'oauth' 
  | 'sessions' 
  | 'security' 
  | 'gdpr' 
  | 'rate_limit'
  | 'debug'
  | 'all';

export type CleanupAction = 
  | 'run-all' 
  | 'run-category' 
  | 'dry-run' 
  | 'status';

export interface CleanupResult {
  category: string;
  table_name: string;
  rows_deleted: number;
}

export interface DryRunResult {
  category: string;
  table_name: string;
  rows_to_delete: number;
}

export interface CleanupExecutionResult {
  success: boolean;
  timestamp: string;
  action: CleanupAction;
  total_rows_deleted: number;
  duration_ms: number;
  results: CleanupResult[];
  errors: string[];
}

export interface DryRunExecutionResult {
  success: boolean;
  timestamp: string;
  action: 'dry-run';
  total_rows_pending: number;
  results: DryRunResult[];
}

export interface RetentionPolicy {
  table_name: string;
  category: CleanupCategory;
  retention_period: string;
  criteria: string;
}

export interface CleanupRequest {
  action?: CleanupAction;
  category?: CleanupCategory;
}

export interface StatusResponse {
  success: boolean;
  timestamp: string;
  policies: RetentionPolicy[];
  categories: CleanupCategory[];
}

export interface BatchResult {
  category: string;
  tables: { name: string; deleted: number }[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_CATEGORIES: CleanupCategory[] = [
  'oauth', 'sessions', 'security', 'gdpr', 'rate_limit', 'debug', 'all'
];

export const VALID_ACTIONS: CleanupAction[] = [
  'run-all', 'run-category', 'dry-run', 'status'
];

export const VALID_PERIODS = [
  '1 hour', '24 hours', '7 days', '30 days', '90 days', '180 days', '365 days'
];

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates if a category is valid
 */
export function isValidCategory(cat: string): boolean {
  return VALID_CATEGORIES.includes(cat as CleanupCategory);
}

/**
 * Validates request has required action
 */
export function validateRequest(req: CleanupRequest): { valid: boolean; error?: string } {
  if (!req.action) {
    return { valid: false, error: 'Missing action parameter' };
  }
  return { valid: true };
}

/**
 * Validates run-category requests have category
 */
export function validateCategoryRequest(req: CleanupRequest): { valid: boolean; error?: string } {
  if (req.action === 'run-category') {
    if (!req.category || !VALID_CATEGORIES.includes(req.category)) {
      return { valid: false, error: `Invalid category. Valid: ${VALID_CATEGORIES.join(', ')}` };
    }
  }
  return { valid: true };
}

/**
 * Validates retention period format
 */
export function isValidPeriod(period: string): boolean {
  return VALID_PERIODS.some(p => period.includes(p.split(' ')[0]));
}

// ============================================================================
// ROUTING HELPERS
// ============================================================================

export type RouteResult = 'full' | 'category' | 'dry' | 'status' | 'unknown';

/**
 * Routes action to handler type
 */
export function routeAction(action: string): RouteResult {
  switch (action) {
    case 'run-all': return 'full';
    case 'run-category': return 'category';
    case 'dry-run': return 'dry';
    case 'status': return 'status';
    default: return 'unknown';
  }
}

// ============================================================================
// CALCULATION HELPERS
// ============================================================================

/**
 * Calculates total rows deleted
 */
export function calculateTotal(results: CleanupResult[]): number {
  return results.reduce((sum, r) => sum + r.rows_deleted, 0);
}

/**
 * Filters results by category
 */
export function filterByCategory(results: CleanupResult[], category: string): CleanupResult[] {
  return results.filter(r => r.category === category);
}

/**
 * Aggregates results by category
 */
export function aggregateResults(results: CleanupResult[]): BatchResult[] {
  const byCategory = new Map<string, { name: string; deleted: number }[]>();
  
  for (const r of results) {
    const existing = byCategory.get(r.category) || [];
    existing.push({ name: r.table_name, deleted: r.rows_deleted });
    byCategory.set(r.category, existing);
  }

  return Array.from(byCategory.entries()).map(([category, tables]) => ({
    category,
    tables
  }));
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Formats RPC errors
 */
export function formatError(error: Error): string {
  return `RPC error: ${error.message}`;
}

/**
 * Handles unknown exceptions
 */
export function handleException(e: unknown): string {
  return `Exception: ${e instanceof Error ? e.message : String(e)}`;
}
