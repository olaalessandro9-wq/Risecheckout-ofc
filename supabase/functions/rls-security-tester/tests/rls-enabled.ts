/**
 * ============================================================================
 * RLS Security Tester - RLS Enabled Test
 * ============================================================================
 * 
 * Tests if RLS is enabled on all tables in the public schema.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type {
  SupabaseClientAny,
  RlsTestResult,
  RlsStatusRow,
} from "../types.ts";

/**
 * Test if RLS is enabled on all public schema tables.
 * Tables without RLS are a CRITICAL security vulnerability.
 */
export async function runRlsEnabledTest(
  supabase: SupabaseClientAny
): Promise<RlsTestResult[]> {
  const results: RlsTestResult[] = [];
  const startTime = Date.now();

  // Query to get RLS status for all tables
  const { data, error } = await supabase.rpc("get_rls_status_all_tables") as {
    data: RlsStatusRow[] | null;
    error: Error | null;
  };

  if (error) {
    results.push({
      testName: "RLS_ENABLED_QUERY",
      category: "RLS_ENABLED",
      tableName: "*",
      status: "failed",
      severity: "critical",
      message: `Failed to query RLS status: ${error.message}`,
      details: {
        expectedBehavior: "Query should return RLS status for all tables",
        actualBehavior: `Query failed: ${error.message}`,
        recommendation: "Ensure get_rls_status_all_tables function exists",
      },
      durationMs: Date.now() - startTime,
    });
    return results;
  }

  const tables = data || [];
  
  for (const table of tables) {
    const testStart = Date.now();
    
    if (table.has_rls) {
      results.push({
        testName: `RLS_ENABLED_${table.tablename.toUpperCase()}`,
        category: "RLS_ENABLED",
        tableName: table.tablename,
        status: "passed",
        severity: "critical",
        message: `RLS is enabled on ${table.tablename}`,
        details: {
          expectedBehavior: "RLS should be enabled",
          actualBehavior: "RLS is enabled",
        },
        durationMs: Date.now() - testStart,
      });
    } else {
      results.push({
        testName: `RLS_ENABLED_${table.tablename.toUpperCase()}`,
        category: "RLS_ENABLED",
        tableName: table.tablename,
        status: "failed",
        severity: "critical",
        message: `CRITICAL: RLS is NOT enabled on ${table.tablename}`,
        details: {
          expectedBehavior: "RLS should be enabled",
          actualBehavior: "RLS is NOT enabled - table is publicly accessible",
          sqlQuery: `ALTER TABLE public.${table.tablename} ENABLE ROW LEVEL SECURITY;`,
          recommendation: `Enable RLS immediately: ALTER TABLE public.${table.tablename} ENABLE ROW LEVEL SECURITY;`,
        },
        durationMs: Date.now() - testStart,
      });
    }
  }

  return results;
}
