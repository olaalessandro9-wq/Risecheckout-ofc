/**
 * SMOKE-TEST EDGE FUNCTION
 * 
 * RISE Protocol Compliant - Router Puro < 60 linhas
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import {
  logInfo,
  logError,
  runAllTests,
  buildSmokeTestResponse,
} from "../_shared/smoke-test-handlers.ts";

const FUNCTION_VERSION = "1.1";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    logInfo(`Versão ${FUNCTION_VERSION} iniciada`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const allTests = await runAllTests(supabase);
    const response = buildSmokeTestResponse(allTests, FUNCTION_VERSION, startTime);

    logInfo(`Testes concluídos: ${response.passed}/${response.total_tests} passaram`, { success: response.success });

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: response.success ? 200 : 500, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const err = error as Error;
    logError('Erro fatal', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message, duration_ms: Date.now() - startTime }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
