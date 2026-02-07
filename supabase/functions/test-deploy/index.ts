import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("test-deploy");
// Build trigger: 2026-02-07T12:00:00Z

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  log.info("Request received:", req.method);

  try {
    const response = {
      status: 'ok',
      message: 'Test deploy successful!',
      created_at: new Date().toISOString(),
      test_id: crypto.randomUUID(),
      environment: {
        deno_version: Deno.version.deno,
        typescript_version: Deno.version.typescript,
      },
    };

    log.info("Returning success response");

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    log.error("Error:", errorMessage);

    return new Response(
      JSON.stringify({
        status: 'error',
        message: errorMessage,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
