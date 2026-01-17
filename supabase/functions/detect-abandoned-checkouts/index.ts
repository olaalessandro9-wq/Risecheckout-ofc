/**
 * Detect Abandoned Checkouts
 * 
 * Detecta checkouts abandonados e dispara ações de recuperação
 * Deve ser executado via cron job
 * 
 * @category Tracking
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

// Checkout is considered abandoned after X minutes of inactivity
const ABANDONMENT_THRESHOLD_MINUTES = 30;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const thresholdTime = new Date(
      Date.now() - ABANDONMENT_THRESHOLD_MINUTES * 60 * 1000
    ).toISOString();

    // Find abandoned sessions (not completed and inactive)
    const { data: abandonedSessions, error: queryError } = await supabase
      .from('checkout_sessions')
      .select('*')
      .eq('status', 'active')
      .lt('last_seen_at', thresholdTime)
      .is('order_id', null);

    if (queryError) {
      console.error('[detect-abandoned-checkouts] Query error:', queryError);
      throw queryError;
    }

    console.log(`[detect-abandoned-checkouts] Found ${abandonedSessions?.length || 0} abandoned sessions`);

    // Update status to abandoned
    if (abandonedSessions && abandonedSessions.length > 0) {
      const sessionIds = abandonedSessions.map(s => s.id);
      
      const { error: updateError } = await supabase
        .from('checkout_sessions')
        .update({ status: 'abandoned' })
        .in('id', sessionIds);

      if (updateError) {
        console.error('[detect-abandoned-checkouts] Update error:', updateError);
      }

      // TODO: Trigger recovery actions (email, webhook, etc.)
      // This could call other edge functions or use background tasks
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        processedCount: abandonedSessions?.length || 0,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[detect-abandoned-checkouts] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
