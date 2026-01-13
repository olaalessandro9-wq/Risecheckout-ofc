const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log('[test-deploy] Request received:', req.method);

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

    console.log('[test-deploy] Returning success response');

    return new Response(
      JSON.stringify(response, null, 2),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[test-deploy] Error:', errorMessage);

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
