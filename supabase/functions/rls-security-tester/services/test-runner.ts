/**
 * ============================================================================
 * RLS Security Tester - Test Runner Service
 * ============================================================================
 * 
 * Orchestrates all RLS security tests and aggregates results.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type {
  SupabaseClientAny,
  RlsTestResult,
  RlsTestSuiteResult,
  TestSummary,
  CriticalTableStatus,
} from "../types.ts";

import { runRlsEnabledTest } from "../tests/rls-enabled.ts";
import { runCriticalTablesTest } from "../tests/critical-tables.ts";
import { runPolicyCoverageTest } from "../tests/policy-coverage.ts";
import { runIdorSimulationTest } from "../tests/idor-simulation.ts";
import { runServiceRoleOnlyTest } from "../tests/service-role-only.ts";

/**
 * Run all RLS security tests and return aggregated results.
 */
export async function runAllTests(
  supabase: SupabaseClientAny
): Promise<RlsTestSuiteResult> {
  const startTime = Date.now();
  const allResults: RlsTestResult[] = [];
  let tablesWithoutRls: string[] = [];
  let tablesWithoutPolicies: string[] = [];
  let criticalTablesStatus: CriticalTableStatus[] = [];

  // Run all tests
  const rlsResults = await runRlsEnabledTest(supabase);
  allResults.push(...rlsResults);
  
  // Extract tables without RLS
  tablesWithoutRls = rlsResults
    .filter(r => r.status === "failed" && r.category === "RLS_ENABLED")
    .map(r => r.tableName);

  const criticalResults = await runCriticalTablesTest(supabase);
  allResults.push(...criticalResults.results);
  criticalTablesStatus = criticalResults.status;

  const coverageResults = await runPolicyCoverageTest(supabase);
  allResults.push(...coverageResults.results);
  tablesWithoutPolicies = coverageResults.tablesWithoutPolicies;

  const idorResults = await runIdorSimulationTest(supabase);
  allResults.push(...idorResults);

  const serviceRoleResults = await runServiceRoleOnlyTest(supabase);
  allResults.push(...serviceRoleResults);

  // Calculate stats
  const passed = allResults.filter(r => r.status === "passed").length;
  const failed = allResults.filter(r => r.status === "failed").length;
  const warnings = allResults.filter(r => r.status === "warning").length;
  const criticalFailures = allResults.filter(
    r => r.status === "failed" && r.severity === "critical"
  ).length;

  // Generate recommendations
  const recommendations = generateRecommendations(
    tablesWithoutRls,
    tablesWithoutPolicies,
    criticalFailures
  );

  const summary: TestSummary = {
    tablesWithoutRls,
    tablesWithoutPolicies,
    criticalTablesStatus,
    recommendations,
  };

  return {
    success: criticalFailures === 0,
    timestamp: new Date().toISOString(),
    totalTests: allResults.length,
    passed,
    failed,
    warnings,
    criticalFailures,
    durationMs: Date.now() - startTime,
    tests: allResults,
    summary,
  };
}

/**
 * Generate actionable recommendations based on test results.
 */
function generateRecommendations(
  tablesWithoutRls: string[],
  tablesWithoutPolicies: string[],
  criticalFailures: number
): string[] {
  const recommendations: string[] = [];

  if (tablesWithoutRls.length > 0) {
    recommendations.push(
      `CRITICAL: Enable RLS on ${tablesWithoutRls.length} tables: ${tablesWithoutRls.slice(0, 5).join(", ")}${tablesWithoutRls.length > 5 ? "..." : ""}`
    );
  }

  if (tablesWithoutPolicies.length > 0) {
    recommendations.push(
      `HIGH: Add policies to ${tablesWithoutPolicies.length} tables: ${tablesWithoutPolicies.slice(0, 5).join(", ")}${tablesWithoutPolicies.length > 5 ? "..." : ""}`
    );
  }

  if (criticalFailures > 0) {
    recommendations.push(
      `Address ${criticalFailures} critical security issues before deploying to production`
    );
  }

  if (recommendations.length === 0) {
    recommendations.push("All RLS security checks passed. Continue monitoring.");
  }

  return recommendations;
}
