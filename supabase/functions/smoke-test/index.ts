/**
 * SMOKE-TEST EDGE FUNCTION
 * 
 * RISE Protocol Compliant - Router Puro < 60 linhas
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";

import {
  runAllTests,
  buildSmokeTestResponse,
} from "../_shared/smoke-test-handlers.ts";
import { createLogger } from "../_shared/logger.ts";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "../_shared/cors-v2.ts";

const log = createLogger("SmokeTest");
const FUNCTION_VERSION = "1.1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    log.info(`Versão ${FUNCTION_VERSION} iniciada`);

    const supabase = getSupabaseClient('general');

    const allTests = await runAllTests(supabase);
    const response = buildSmokeTestResponse(allTests, FUNCTION_VERSION, startTime);

    log.info(`Testes concluídos: ${response.passed}/${response.total_tests} passaram`, { success: response.success });

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: response.success ? 200 : 500, 
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: unknown) {
    const err = error as Error;
    log.error('Erro fatal', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message, duration_ms: Date.now() - startTime }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
