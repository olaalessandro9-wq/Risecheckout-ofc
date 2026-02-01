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
import { SERVICE_ROLE_ONLY_TABLES, normalizeRoles } from "../types.ts";

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
    // A policy is problematic if it's PERMISSIVE, allows access, 
    // and grants access to non-service roles
    const hasPermissivePublic = tablePolicies.some(p => {
      const qual = (p.qual || '').toLowerCase().trim();
      const withCheck = (p.with_check || '').toLowerCase().trim();
      
      // RISE V3: Use normalizeRoles helper to safely parse roles
      const rolesStr = normalizeRoles(p.roles);
      
      // Skip if policy is specifically for service_role only
      if (rolesStr === 'service_role') {
        return false;
      }
      
      // Skip if qual is 'false' - this is a DENY policy for SELECT/UPDATE/DELETE
      // Skip if with_check is 'false' - this is a DENY policy for INSERT/UPDATE
      // These are used to block all access, letting only service_role bypass RLS
      if (qual === 'false' || withCheck === 'false') {
        return false;
      }
      
      // Flag if permissive and allows broad access to authenticated/anon/public
      return p.permissive === 'PERMISSIVE' && (
        rolesStr.includes('authenticated') ||
        rolesStr.includes('anon') ||
        rolesStr.includes('public')
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
