/**
 * Detect Abandoned Checkouts
 * 
 * Detecta checkouts abandonados e dispara ações de recuperação.
 * Deve ser executado via cron job (pg_cron ou scheduler externo).
 * 
 * @category Tracking
 * @status active
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("detect-abandoned-checkouts");

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
      log.error('Query error:', queryError);
      throw queryError;
    }

    log.info(`Found ${abandonedSessions?.length || 0} abandoned sessions`);

    // Update status to abandoned
    if (abandonedSessions && abandonedSessions.length > 0) {
      const sessionIds = abandonedSessions.map(s => s.id);
      
      const { error: updateError } = await supabase
        .from('checkout_sessions')
        .update({ status: 'abandoned' })
        .in('id', sessionIds);

      if (updateError) {
        log.error('Update error:', updateError);
      }

      // Recovery actions são acionadas via webhook ou edge function dedicada.
      // Ver: retry-webhooks para reenvio de notificações falhadas.
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
    log.error('Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
