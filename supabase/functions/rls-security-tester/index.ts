/**
 * ============================================================================
 * RLS Security Tester - Edge Function Router
 * ============================================================================
 * 
 * Automated RLS security testing framework.
 * 
 * Endpoints:
 * - POST { action: "run-all" } - Run all RLS security tests
 * 
 * @version 1.0.0 - RISE Protocol V3 Compliant
 * ============================================================================
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import type { SupabaseClientAny, TestRequest } from "./types.ts";
import { runAllTests } from "./services/test-runner.ts";

const log = createLogger("RlsSecurityTester");

// ============================================================================
// MAIN HANDLER
// ============================================================================

Deno.serve(async (req: Request) => {
  // Handle CORS
  const corsResult = handleCorsV2(req);
  if (corsResult instanceof Response) return corsResult;
  const corsHeaders = corsResult.headers;

  // Validate method
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // Initialize Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClientAny = createClient(supabaseUrl, serviceRoleKey);

    // Parse request
    const body: TestRequest = await req.json();
    const { action } = body;

    log.info(`Action: ${action}`);

    switch (action) {
      case "run-all": {
        const results = await runAllTests(supabase);
        
        log.info(`Tests complete: ${results.passed}/${results.totalTests} passed, ${results.criticalFailures} critical failures`);

        return new Response(
          JSON.stringify(results),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}`, hint: "Use 'run-all'" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    log.error(`Exception: ${errorMessage}`);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
