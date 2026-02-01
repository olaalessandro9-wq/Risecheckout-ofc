/**
 * Testing Infrastructure - Environment Configuration
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Centralized environment detection and skip logic for tests.
 * Replaces 38 files with local skipTests implementations.
 * 
 * @module _shared/testing/test-config
 * @version 1.0.0
 */

import type { TestConfig, TestEnvironment } from "./types.ts";

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

/**
 * Detects the current test environment based on available variables.
 * 
 * Priority:
 * 1. integration: SUPABASE_URL + SERVICE_ROLE_KEY + RUN_INTEGRATION=true
 * 2. contract: SUPABASE_URL only (mock external calls)
 * 3. unit: default (pure logic tests)
 */
function detectEnvironment(): TestEnvironment {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const runIntegration = Deno.env.get("RUN_INTEGRATION_TESTS") === "true";

  // Check for mock/test URLs that indicate unit testing
  const isMockUrl = !supabaseUrl || 
    supabaseUrl.includes("test.supabase.co") || 
    supabaseUrl.includes("localhost") ||
    !supabaseUrl.startsWith("https://");

  if (!isMockUrl && serviceRoleKey && runIntegration) {
    return "integration";
  }

  if (!isMockUrl && supabaseUrl) {
    return "contract";
  }

  return "unit";
}

/**
 * Detects if running in a CI environment
 */
function detectCI(): boolean {
  return (
    Deno.env.get("CI") === "true" ||
    Deno.env.get("GITHUB_ACTIONS") === "true" ||
    Deno.env.get("LOVABLE_CI") === "true" ||
    !!Deno.env.get("LOVABLE_PROJECT_ID")
  );
}

// ============================================================================
// MAIN EXPORTS
// ============================================================================

/**
 * Returns the complete test configuration for the current environment.
 * 
 * @example
 * ```typescript
 * const config = getTestConfig();
 * console.log(config.environment); // "unit" | "contract" | "integration"
 * ```
 */
export function getTestConfig(): TestConfig {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? null;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? null;
  const hasServiceRoleKey = !!Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const runIntegration = Deno.env.get("RUN_INTEGRATION_TESTS") === "true";

  return {
    environment: detectEnvironment(),
    supabaseUrl,
    supabaseAnonKey,
    hasServiceRoleKey,
    isCI: detectCI(),
    runIntegration,
  };
}

/**
 * Returns true if integration tests should be skipped.
 * Use this to mark tests that require real Supabase connection.
 * 
 * @example
 * ```typescript
 * Deno.test({
 *   name: "integration: creates real order",
 *   ignore: skipIntegration(),
 *   fn: async () => { ... }
 * });
 * ```
 */
export function skipIntegration(): boolean {
  const config = getTestConfig();
  return config.environment !== "integration";
}

/**
 * Returns true if contract tests should be skipped.
 * Use this to mark tests that need at least SUPABASE_URL.
 * 
 * @example
 * ```typescript
 * Deno.test({
 *   name: "contract: validates API schema",
 *   ignore: skipContract(),
 *   fn: async () => { ... }
 * });
 * ```
 */
export function skipContract(): boolean {
  const config = getTestConfig();
  return config.environment === "unit";
}

/**
 * Returns true if running in CI environment.
 * Useful for conditional test behavior.
 * 
 * @example
 * ```typescript
 * if (isCI()) {
 *   // Use longer timeouts in CI
 *   await new Promise(r => setTimeout(r, 5000));
 * }
 * ```
 */
export function isCI(): boolean {
  return detectCI();
}

/**
 * Returns true if unit tests should run (always true).
 * Provided for API consistency.
 */
export function runUnit(): boolean {
  return true;
}

/**
 * Returns true if current environment matches the specified type.
 * 
 * @example
 * ```typescript
 * if (isEnvironment("integration")) {
 *   // Setup real database fixtures
 * }
 * ```
 */
export function isEnvironment(env: TestEnvironment): boolean {
  return getTestConfig().environment === env;
}

// ============================================================================
// SANITIZER PRESETS
// ============================================================================

/**
 * Common test options for unit tests (strict sanitizers)
 */
export const unitTestOptions = {
  sanitizeResources: true,
  sanitizeOps: true,
  sanitizeExit: true,
} as const;

/**
 * Common test options for integration tests (relaxed sanitizers)
 */
export const integrationTestOptions = {
  sanitizeResources: false,
  sanitizeOps: false,
  sanitizeExit: false,
} as const;

/**
 * Creates test options based on current environment
 */
export function getTestOptions(override?: Partial<Deno.TestDefinition>): Partial<Deno.TestDefinition> {
  const config = getTestConfig();
  const baseOptions = config.environment === "integration" 
    ? integrationTestOptions 
    : unitTestOptions;

  return { ...baseOptions, ...override };
}
