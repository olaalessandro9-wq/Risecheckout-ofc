/**
 * ============================================================================
 * RLS Security Tester - IDOR Simulation Test
 * ============================================================================
 * 
 * Simulates Insecure Direct Object Reference attacks by checking
 * if policies properly restrict cross-user access.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type {
  SupabaseClientAny,
  RlsTestResult,
  PolicyRow,
} from "../types.ts";

// Tables with user_id that should prevent cross-user access
const USER_SCOPED_TABLES = [
  { table: 'orders', userColumn: 'customer_email' },
  { table: 'buyer_product_access', userColumn: 'buyer_id' },
  { table: 'buyer_content_access', userColumn: 'buyer_id' },
  { table: 'buyer_sessions', userColumn: 'buyer_id' },
  { table: 'affiliates', userColumn: 'user_id' },
  { table: 'products', userColumn: 'user_id' },
  { table: 'notifications', userColumn: 'user_id' },
];

/**
 * Test for IDOR vulnerabilities by analyzing policy definitions.
 */
export async function runIdorSimulationTest(
  supabase: SupabaseClientAny
): Promise<RlsTestResult[]> {
  const results: RlsTestResult[] = [];

  // Get all policies
  const { data: policies, error } = await supabase.rpc("get_all_policies") as {
    data: PolicyRow[] | null;
    error: Error | null;
  };

  if (error) {
    results.push({
      testName: "IDOR_SIMULATION_QUERY",
      category: "IDOR_SIMULATION",
      tableName: "*",
      status: "failed",
      severity: "critical",
      message: `Failed to query policies: ${error.message}`,
      details: {
        expectedBehavior: "Query should return all policy definitions",
        actualBehavior: `Query failed: ${error.message}`,
        recommendation: "Ensure get_all_policies function exists",
      },
      durationMs: 0,
    });
    return results;
  }

  const policyList = policies || [];
  const policyMap = new Map<string, PolicyRow[]>();
  
  for (const policy of policyList) {
    const existing = policyMap.get(policy.tablename) || [];
    existing.push(policy);
    policyMap.set(policy.tablename, existing);
  }

  // Check each user-scoped table
  for (const { table, userColumn } of USER_SCOPED_TABLES) {
    const startTime = Date.now();
    const tablePolicies = policyMap.get(table) || [];

    if (tablePolicies.length === 0) {
      results.push({
        testName: `IDOR_${table.toUpperCase()}`,
        category: "IDOR_SIMULATION",
        tableName: table,
        status: "failed",
        severity: "critical",
        message: `CRITICAL: User-scoped table ${table} has NO policies - IDOR vulnerable`,
        details: {
          expectedBehavior: `Policies should restrict access by ${userColumn}`,
          actualBehavior: "No policies found - any user can access any record",
          recommendation: `Add policy: USING (auth.uid() = ${userColumn}) or equivalent`,
        },
        durationMs: Date.now() - startTime,
      });
      continue;
    }

    // Check if any SELECT policy references the user column
    const selectPolicies = tablePolicies.filter(p => p.cmd === 'SELECT' || p.cmd === 'ALL');
    const hasUserCheck = selectPolicies.some(p => {
      const qual = p.qual?.toLowerCase() || '';
      return qual.includes('auth.uid()') || 
             qual.includes(userColumn.toLowerCase()) ||
             qual.includes('user_id') ||
             qual.includes('buyer_id') ||
             qual.includes('customer_email');
    });

    if (hasUserCheck) {
      results.push({
        testName: `IDOR_${table.toUpperCase()}`,
        category: "IDOR_SIMULATION",
        tableName: table,
        status: "passed",
        severity: "critical",
        message: `Table ${table} has user-scoped SELECT policy`,
        details: {
          expectedBehavior: `Policies should restrict access by ${userColumn}`,
          actualBehavior: "User-scoped policy found",
        },
        durationMs: Date.now() - startTime,
      });
    } else {
      // Check if it's intentionally public (e.g., products)
      const isPublicOk = tablePolicies.some(p => 
        p.policyname.toLowerCase().includes('public') ||
        p.qual === 'true'
      );

      if (isPublicOk) {
        results.push({
          testName: `IDOR_${table.toUpperCase()}`,
          category: "IDOR_SIMULATION",
          tableName: table,
          status: "warning",
          severity: "medium",
          message: `Table ${table} appears intentionally public - verify this is correct`,
          details: {
            expectedBehavior: `Policies should restrict access by ${userColumn}`,
            actualBehavior: "Public access policy found",
            recommendation: "Verify public access is intentional for this table",
          },
          durationMs: Date.now() - startTime,
        });
      } else {
        results.push({
          testName: `IDOR_${table.toUpperCase()}`,
          category: "IDOR_SIMULATION",
          tableName: table,
          status: "warning",
          severity: "high",
          message: `Table ${table} may be IDOR vulnerable - no user-scoped policy detected`,
          details: {
            expectedBehavior: `Policies should restrict access by ${userColumn}`,
            actualBehavior: "No user-scoped restriction found in policies",
            recommendation: `Review policies and add user-scoped restriction: USING (${userColumn} = auth.uid())`,
          },
          durationMs: Date.now() - startTime,
        });
      }
    }
  }

  return results;
}
