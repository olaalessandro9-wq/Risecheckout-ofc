import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  const startTime = Date.now();
  
  try {
    // Inicializa o cliente Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Testa a conexão com o banco de dados
    const { error: dbError } = await supabase
      .from('orders')
      .select('count')
      .limit(1)
      .single();

    if (dbError && dbError.code !== 'PGRST116') {
      // PGRST116 = nenhum resultado encontrado (aceitável para health check)
      throw new Error(`Database check failed: ${dbError.message}`);
    }

    const responseTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        status: 'OK',
        timestamp: new Date().toISOString(),
        services: {
          database: 'healthy',
          edgeFunction: 'healthy',
        },
        responseTime: `${responseTime}ms`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const err = error instanceof Error ? error : new Error(String(error));

    return new Response(
      JSON.stringify({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: err.message,
        responseTime: `${responseTime}ms`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
