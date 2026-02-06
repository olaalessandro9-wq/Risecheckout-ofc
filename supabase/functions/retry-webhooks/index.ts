/**
 * Retry Webhooks
 * 
 * Reenvia webhooks que falharam (até MAX_RETRIES tentativas).
 * Deve ser executado via cron job (pg_cron ou scheduler externo).
 * 
 * @category Webhooks
 * @status active
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;
const log = createLogger("RetryWebhooks");

const MAX_RETRIES = 3;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = getSupabaseClient('webhooks');

    // Find failed webhooks that need retry
    const { data: failedWebhooks, error: queryError } = await supabase
      .from('webhook_deliveries')
      .select('*')
      .eq('success', false)
      .lt('retry_count', MAX_RETRIES)
      .order('created_at', { ascending: true })
      .limit(50);

    if (queryError) {
      log.error("Query error:", queryError);
      throw queryError;
    }

    log.info(`Found ${failedWebhooks?.length || 0} webhooks to retry`);

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
        log.error(`Error retrying webhook ${webhook.id}:`, errorMessage);
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

    log.info(`Complete - Success: ${successCount}, Failed: ${failCount}`);

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
    log.error("Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
