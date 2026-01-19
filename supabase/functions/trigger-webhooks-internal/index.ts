/**
 * Trigger Webhooks Internal
 * 
 * Função interna para disparar webhooks a partir de triggers do banco
 * Chamada internamente pelo sistema
 * 
 * @category Webhooks
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      vendorId,
      eventType,
      resourceId,
      resourceType,
      data,
    } = await req.json();

    if (!vendorId || !eventType) {
      return new Response(
        JSON.stringify({ error: 'vendorId and eventType are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get all active webhooks for this vendor and event
    const { data: webhookConfigs, error: configError } = await supabase
      .from('webhook_configs')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('active', true)
      .or(`event_type.eq.${eventType},event_type.eq.*`);

    if (configError) {
      console.error('[trigger-webhooks-internal] Config query error:', configError);
      throw configError;
    }

    if (!webhookConfigs || webhookConfigs.length === 0) {
      console.log(`[trigger-webhooks-internal] No webhooks configured for ${eventType}`);
      return new Response(
        JSON.stringify({ success: true, webhooksTriggered: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build payload
    const webhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      resourceType,
      resourceId,
      data,
    };

    let successCount = 0;
    let failCount = 0;

    // Dispatch to all configured webhooks
    for (const config of webhookConfigs) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };

        // Add signature if secret configured
        if (config.secret) {
          const encoder = new TextEncoder();
          const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(config.secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
          );
          const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(JSON.stringify(webhookPayload))
          );
          const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
          headers['X-Webhook-Signature'] = signatureHex;
        }

        const response = await fetch(config.url, {
          method: 'POST',
          headers,
          body: JSON.stringify(webhookPayload),
        });

        // Log delivery
        await supabase.from('webhook_deliveries').insert({
          vendor_id: vendorId,
          webhook_config_id: config.id,
          event_type: eventType,
          url: config.url,
          payload: webhookPayload,
          status_code: response.status,
          success: response.ok,
        });

        if (response.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`[trigger-webhooks-internal] Error sending to ${config.url}:`, errorMessage);
        failCount++;
      }
    }

    console.log(`[trigger-webhooks-internal] ${eventType} - Success: ${successCount}, Failed: ${failCount}`);

    return new Response(
      JSON.stringify({
        success: true,
        webhooksTriggered: webhookConfigs.length,
        successCount,
        failCount,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[trigger-webhooks-internal] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
