/**
 * Checkout Heartbeat
 * 
 * Registra heartbeat de sessões de checkout para tracking de abandono.
 * Chamado periodicamente pelo frontend durante o processo de checkout.
 * 
 * @category Tracking
 * @status active
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("checkout-heartbeat");
const corsHeaders = PUBLIC_CORS_HEADERS;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient('general');

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
      log.error('Upsert error:', upsertError);
      // Don't fail on upsert error, just log it
    }

    log.info(`Session ${sessionId} updated, step: ${step}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
