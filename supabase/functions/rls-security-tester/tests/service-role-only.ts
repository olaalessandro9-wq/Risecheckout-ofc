/**
 * ============================================================================
 * RLS Security Tester - Service Role Only Test
 * ============================================================================
 * 
 * Tests that sensitive tables are only accessible by service_role.
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import type {
  SupabaseClientAny,
  RlsTestResult,
  PolicyRow,
} from "../types.ts";
import { SERVICE_ROLE_ONLY_TABLES } from "../types.ts";

/**
 * Test that sensitive tables deny all access except service_role.
 */
export async function runServiceRoleOnlyTest(
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
      testName: "SERVICE_ROLE_ONLY_QUERY",
      category: "SERVICE_ROLE_ONLY",
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

  // Check each service-role-only table
  for (const tableName of SERVICE_ROLE_ONLY_TABLES) {
    const startTime = Date.now();
    const tablePolicies = policyMap.get(tableName) || [];

    // These tables should either:
    // 1. Have no policies (RLS blocks all, only service_role bypasses)
    // 2. Have policies that explicitly check for service_role
    // 3. Have policies that use RESTRICTIVE with false

    if (tablePolicies.length === 0) {
      // Good - no policies means only service_role can access
      results.push({
        testName: `SERVICE_ROLE_${tableName.toUpperCase()}`,
        category: "SERVICE_ROLE_ONLY",
        tableName,
        status: "passed",
        severity: "critical",
        message: `Table ${tableName} has no policies - service_role only access`,
        details: {
          expectedBehavior: "No policies should exist (service_role bypasses RLS)",
          actualBehavior: "No policies found - correctly restricted",
        },
        durationMs: Date.now() - startTime,
      });
      continue;
    }

    // Check if policies are properly restrictive
    const hasPermissivePublic = tablePolicies.some(p => {
      const qual = p.qual?.toLowerCase() || '';
      return p.permissive === 'PERMISSIVE' && (
        qual === 'true' ||
        qual.includes('authenticated') ||
        qual.includes('anon')
      );
    });

    if (hasPermissivePublic) {
      results.push({
        testName: `SERVICE_ROLE_${tableName.toUpperCase()}`,
        category: "SERVICE_ROLE_ONLY",
        tableName,
        status: "failed",
        severity: "critical",
        message: `CRITICAL: Sensitive table ${tableName} has permissive policies allowing non-service access`,
        details: {
          expectedBehavior: "Only service_role should access this table",
          actualBehavior: "Permissive policy allows broader access",
          recommendation: "Remove permissive policies or make them RESTRICTIVE with false",
        },
        durationMs: Date.now() - startTime,
      });
    } else {
      results.push({
        testName: `SERVICE_ROLE_${tableName.toUpperCase()}`,
        category: "SERVICE_ROLE_ONLY",
        tableName,
        status: "passed",
        severity: "critical",
        message: `Table ${tableName} policies appear correctly restrictive`,
        details: {
          expectedBehavior: "Only service_role should access this table",
          actualBehavior: `${tablePolicies.length} policies found, none permissive to public`,
        },
        durationMs: Date.now() - startTime,
      });
    }
  }

  return results;
}
