/**
 * Shared Types & Helpers for key-rotation-executor Tests
 * 
 * @module key-rotation-executor/tests/_shared
 * @version 1.0.0 - RISE Protocol V3 Compliant
 */

// ============================================================================
// TYPES
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

export interface RotateTableResult {
  processed: number;
  failed: number;
}

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

export interface KeyVersionRow {
  version: number;
  status: string;
}

export interface RotationProgress {
  log_id: string;
  processed: number;
  failed: number;
}

export interface RotationCompletion {
  log_id: string;
  success: boolean;
  error: string | null;
}

export interface ActivateResponse {
  success: boolean;
  activatedVersion: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_ACTIONS = ["status", "prepare", "rotate", "activate"] as const;
export type ValidAction = typeof VALID_ACTIONS[number];

export const DEFAULT_BATCH_SIZE = 100;

export const DEFAULT_ROTATION_CONFIG = {
  batchSize: 100,
  delayBetweenBatches: 100,
  tables: [
    { tableName: "orders", encryptedColumns: ["customer_phone", "customer_document"], primaryKey: "id" }
  ]
};

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates if action is valid
 */
export function isValidAction(action: string): boolean {
  return VALID_ACTIONS.includes(action as ValidAction);
}

/**
 * Routes action and returns error if unknown
 */
export function routeAction(action: string): { error?: string } {
  if (!isValidAction(action)) {
    return { error: `Unknown action: ${action}` };
  }
  return {};
}

/**
 * Validates prepare request
 */
export function validatePrepare(body: PrepareRequestBody): { valid: boolean; error?: string } {
  if (!body.newVersion || body.newVersion < 2) {
    return { valid: false, error: "Invalid version. Must be >= 2" };
  }
  return { valid: true };
}

/**
 * Validates rotate request
 */
export function validateRotate(body: RotateRequestBody): { valid: boolean; error?: string } {
  if (!body.targetVersion) {
    return { valid: false, error: "targetVersion is required" };
  }
  return { valid: true };
}

/**
 * Validates activate request
 */
export function validateActivate(body: ActivateRequestBody): { valid: boolean; error?: string } {
  if (!body.version) {
    return { valid: false, error: "version is required" };
  }
  return { valid: true };
}

// ============================================================================
// KEY MANAGEMENT HELPERS
// ============================================================================

/**
 * Gets key identifier for version
 */
export function getKeyIdentifier(version: number, provided?: string): string {
  return provided || `BUYER_ENCRYPTION_KEY_V${version}`;
}

/**
 * Checks if environment variable exists
 */
export function checkEnvVar(version: number, env: Record<string, string | undefined>): { exists: boolean; hint?: string } {
  const envVar = `BUYER_ENCRYPTION_KEY_V${version}`;
  if (!env[envVar]) {
    return { 
      exists: false, 
      hint: `Add the secret ${envVar} in Supabase Edge Functions settings before preparing rotation`
    };
  }
  return { exists: true };
}

/**
 * Gets batch size with default
 */
export function getBatchSize(provided?: number): number {
  return provided || DEFAULT_BATCH_SIZE;
}

/**
 * Checks if version exists in available versions
 */
export function hasVersion(targetVersion: number, availableVersions: number[]): boolean {
  return availableVersions.includes(targetVersion);
}

// ============================================================================
// ROTATION HELPERS
// ============================================================================

/**
 * Determines if record needs rotation
 */
export function shouldRotate(currentVersion: number | null, targetVersion: number): boolean {
  if (currentVersion === null) return false;
  if (currentVersion >= targetVersion) return false;
  return true;
}

/**
 * Aggregates multiple rotation results
 */
export function aggregateResults(results: RotateTableResult[]): RotateTableResult {
  return {
    processed: results.reduce((sum, r) => sum + r.processed, 0),
    failed: results.reduce((sum, r) => sum + r.failed, 0)
  };
}

/**
 * Gets result message based on failures
 */
export function getResultMessage(failed: number): string {
  return failed === 0 
    ? "Rotation completed successfully. Run 'activate' to finalize."
    : "Rotation completed with errors. Review before activating.";
}

// ============================================================================
// BATCH PROCESSING HELPERS
// ============================================================================

/**
 * Gets next batch from items
 */
export function getNextBatch<T extends { id: string }>(
  items: T[],
  lastId: string | null,
  batchSize: number
): T[] {
  if (!lastId) {
    return items.slice(0, batchSize);
  }
  const startIdx = items.findIndex(item => item.id === lastId) + 1;
  return items.slice(startIdx, startIdx + batchSize);
}

/**
 * Checks if batch processing is complete
 */
export function isEndOfData(batchSize: number): boolean {
  return batchSize === 0;
}

// ============================================================================
// ENCRYPTION HELPERS
// ============================================================================

/**
 * Checks if value is encrypted
 */
export function isEncrypted(value: string): boolean {
  return value.startsWith("v") && value.includes(":");
}

/**
 * Extracts version from encrypted value
 */
export function getEncryptedVersion(value: string): number | null {
  const match = value.match(/^v(\d+):/);
  return match ? parseInt(match[1], 10) : null;
}

// ============================================================================
// ERROR HELPERS
// ============================================================================

/**
 * Formats error message
 */
export function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * Checks if method is allowed
 */
export function isAllowedMethod(method: string): boolean {
  return method === "POST";
}
