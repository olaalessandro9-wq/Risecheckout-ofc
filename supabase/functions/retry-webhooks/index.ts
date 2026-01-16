/**
 * Retry Webhooks
 * 
 * Reenvia webhooks que falharam
 * Deve ser executado via cron job
 * 
 * @category Webhooks
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_RETRIES = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find failed webhooks that need retry
    const { data: failedWebhooks, error: queryError } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('success', false)
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(50);

    if (queryError) {
      console.error('[retry-webhooks] Query error:', queryError);
      throw queryError;
    }

    console.log(`[retry-webhooks] Found ${failedWebhooks?.length || 0} webhooks to retry`);

    let successCount = 0;
    let failCount = 0;

    for (const webhook of failedWebhooks || []) {
      try {
        const response = await fetch(webhook.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(webhook.payload),
        });

        const success = response.ok;
        
        // Update webhook delivery record
        await supabase
          .from('webhook_deliveries')
          .update({
            success,
            retry_count: (webhook.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString(),
            status_code: response.status,
          })
          .eq('id', webhook.id);

        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[retry-webhooks] Error retrying webhook ${webhook.id}:`, errorMessage);
        failCount++;
        
        await supabase
          .from('webhook_deliveries')
          .update({
            retry_count: (webhook.retry_count || 0) + 1,
            last_retry_at: new Date().toISOString(),
          })
          .eq('id', webhook.id);
      }
    }

    console.log(`[retry-webhooks] Complete - Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        processed: failedWebhooks?.length || 0,
        successCount,
        failCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[retry-webhooks] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
