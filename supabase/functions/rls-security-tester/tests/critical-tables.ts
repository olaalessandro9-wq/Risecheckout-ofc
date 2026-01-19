/**
 * ============================================================================
 * RLS Security Tester - Critical Tables Test
 * ============================================================================
 * 
 * Tests that critical tables have proper RLS and policies.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type {
  SupabaseClientAny,
  RlsTestResult,
  CriticalTableStatus,
  PolicyCoverageRow,
} from "../types.ts";
import { CRITICAL_TABLES } from "../types.ts";

/**
 * Test critical tables for proper RLS configuration.
 */
export async function runCriticalTablesTest(
  supabase: SupabaseClientAny
): Promise<{ results: RlsTestResult[]; status: CriticalTableStatus[] }> {
  const results: RlsTestResult[] = [];
  const criticalStatus: CriticalTableStatus[] = [];

  // Get policy coverage for all tables
  const { data: coverage, error } = await supabase.rpc("get_policy_coverage") as {
    data: PolicyCoverageRow[] | null;
    error: Error | null;
  };

  if (error) {
    results.push({
      testName: "CRITICAL_TABLES_QUERY",
      category: "CRITICAL_TABLES",
      tableName: "*",
      status: "failed",
      severity: "critical",
      message: `Failed to query policy coverage: ${error.message}`,
      details: {
        expectedBehavior: "Query should return policy coverage for all tables",
        actualBehavior: `Query failed: ${error.message}`,
        recommendation: "Ensure get_policy_coverage function exists",
      },
      durationMs: 0,
    });
    return { results, status: criticalStatus };
  }

  const coverageMap = new Map<string, PolicyCoverageRow>();
  for (const row of coverage || []) {
    coverageMap.set(row.tablename, row);
  }

  // Check each critical table
  for (const tableName of CRITICAL_TABLES) {
    const startTime = Date.now();
    const tableData = coverageMap.get(tableName);

    if (!tableData) {
      // Table might not exist - warning, not failure
      results.push({
        testName: `CRITICAL_TABLE_${tableName.toUpperCase()}`,
        category: "CRITICAL_TABLES",
        tableName,
        status: "warning",
        severity: "medium",
        message: `Critical table ${tableName} not found or has no policies`,
        details: {
          expectedBehavior: "Table should exist and have policies",
          actualBehavior: "Table not found in policy query results",
          recommendation: "Verify table exists and add RLS policies",
        },
        durationMs: Date.now() - startTime,
      });

      criticalStatus.push({
        tableName,
        hasRls: false,
        policyCount: 0,
        operations: { select: false, insert: false, update: false, delete: false },
      });
      continue;
    }

    const operations = {
      select: tableData.select_policies > 0,
      insert: tableData.insert_policies > 0,
      update: tableData.update_policies > 0,
      delete: tableData.delete_policies > 0,
    };

    const totalPolicies = 
      tableData.select_policies + 
      tableData.insert_policies + 
      tableData.update_policies + 
      tableData.delete_policies;

    criticalStatus.push({
      tableName,
      hasRls: true, // If it has policies, RLS is implicitly enabled
      policyCount: totalPolicies,
      operations,
    });

    // Check if all operations have policies
    const missingOps = Object.entries(operations)
      .filter(([, has]) => !has)
      .map(([op]) => op);

    if (missingOps.length === 0) {
      results.push({
        testName: `CRITICAL_TABLE_${tableName.toUpperCase()}`,
        category: "CRITICAL_TABLES",
        tableName,
        status: "passed",
        severity: "critical",
        message: `Critical table ${tableName} has complete policy coverage`,
        details: {
          expectedBehavior: "All CRUD operations should have policies",
          actualBehavior: `Policies: SELECT=${tableData.select_policies}, INSERT=${tableData.insert_policies}, UPDATE=${tableData.update_policies}, DELETE=${tableData.delete_policies}`,
        },
        durationMs: Date.now() - startTime,
      });
    } else {
      results.push({
        testName: `CRITICAL_TABLE_${tableName.toUpperCase()}`,
        category: "CRITICAL_TABLES",
        tableName,
        status: "warning",
        severity: "high",
        message: `Critical table ${tableName} missing policies for: ${missingOps.join(", ")}`,
        details: {
          expectedBehavior: "All CRUD operations should have policies",
          actualBehavior: `Missing policies for: ${missingOps.join(", ")}`,
          recommendation: `Add policies for ${missingOps.join(", ")} operations`,
        },
        durationMs: Date.now() - startTime,
      });
    }
  }

  return { results, status: criticalStatus };
}
