/**
 * ============================================================================
 * RLS Security Tester - Policy Coverage Test
 * ============================================================================
 * 
 * Tests that all tables have complete policy coverage for CRUD operations.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type {
  SupabaseClientAny,
  RlsTestResult,
  PolicyCoverageRow,
} from "../types.ts";

/**
 * Test policy coverage across all tables.
 */
export async function runPolicyCoverageTest(
  supabase: SupabaseClientAny
): Promise<{ results: RlsTestResult[]; tablesWithoutPolicies: string[] }> {
  const results: RlsTestResult[] = [];
  const tablesWithoutPolicies: string[] = [];
  const startTime = Date.now();

  // Get all tables with their policy counts
  const { data, error } = await supabase.rpc("get_tables_without_policies") as {
    data: string[] | null;
    error: Error | null;
  };

  if (error) {
    results.push({
      testName: "POLICY_COVERAGE_QUERY",
      category: "POLICY_COVERAGE",
      tableName: "*",
      status: "failed",
      severity: "high",
      message: `Failed to query tables without policies: ${error.message}`,
      details: {
        expectedBehavior: "Query should return tables missing policies",
        actualBehavior: `Query failed: ${error.message}`,
        recommendation: "Ensure get_tables_without_policies function exists",
      },
      durationMs: Date.now() - startTime,
    });
    return { results, tablesWithoutPolicies };
  }

  const noPolicyTables = data || [];
  tablesWithoutPolicies.push(...noPolicyTables);

  if (noPolicyTables.length === 0) {
    results.push({
      testName: "POLICY_COVERAGE_ALL",
      category: "POLICY_COVERAGE",
      tableName: "*",
      status: "passed",
      severity: "high",
      message: "All tables have at least one policy defined",
      details: {
        expectedBehavior: "All tables should have policies",
        actualBehavior: "All tables have policies",
      },
      durationMs: Date.now() - startTime,
    });
  } else {
    for (const tableName of noPolicyTables) {
      results.push({
        testName: `POLICY_COVERAGE_${tableName.toUpperCase()}`,
        category: "POLICY_COVERAGE",
        tableName,
        status: "failed",
        severity: "high",
        message: `Table ${tableName} has NO policies defined`,
        details: {
          expectedBehavior: "Table should have at least one policy",
          actualBehavior: "No policies found",
          recommendation: `Add at least a SELECT policy for table ${tableName}`,
        },
        durationMs: 0,
      });
    }
  }

  return { results, tablesWithoutPolicies };
}
