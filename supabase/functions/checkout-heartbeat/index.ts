/**
 * Checkout Heartbeat
 * 
 * Registra heartbeat de sessões de checkout para tracking de abandono
 * 
 * @category Tracking
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { sessionId, checkoutId, step, metadata } = await req.json();

    if (!sessionId || !checkoutId) {
      return new Response(
        JSON.stringify({ error: 'sessionId and checkoutId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Upsert checkout session
    const { error: upsertError } = await supabase
      .from('checkout_sessions')
      .upsert({
        id: sessionId,
        vendor_id: metadata?.vendorId || '',
        status: step || 'active',
        last_seen_at: new Date().toISOString(),
      }, {
        onConflict: 'id',
      });

    if (upsertError) {
      console.error('[checkout-heartbeat] Upsert error:', upsertError);
      // Don't fail on upsert error, just log it
    }

    console.log(`[checkout-heartbeat] Session ${sessionId} updated, step: ${step}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[checkout-heartbeat] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
