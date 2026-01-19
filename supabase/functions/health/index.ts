import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("health");

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
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return new Response(
      JSON.stringify({
        status: 'ERROR',
        timestamp: new Date().toISOString(),
        error: errorMessage,
        responseTime: `${responseTime}ms`,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
