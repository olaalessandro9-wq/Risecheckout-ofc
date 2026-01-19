/**
 * Dispatch Webhook
 * 
 * Dispara webhooks para endpoints configurados pelo vendor
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
      payload,
      webhookUrl,
      webhookSecret,
    } = await req.json();

    if (!vendorId || !eventType || !payload) {
      return new Response(
        JSON.stringify({ error: 'vendorId, eventType, and payload are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get webhook configuration if URL not provided
    let targetUrl = webhookUrl;
    let secret = webhookSecret;

    if (!targetUrl) {
      const { data: webhookConfig } = await supabase
        .from('webhook_configs')
        .select('url, secret')
        .eq('vendor_id', vendorId)
        .eq('event_type', eventType)
        .eq('active', true)
        .single();

      if (!webhookConfig) {
        console.log(`[dispatch-webhook] No webhook configured for ${eventType}`);
        return new Response(
          JSON.stringify({ success: false, reason: 'No webhook configured' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      targetUrl = webhookConfig.url;
      secret = webhookConfig.secret;
    }

    // Prepare webhook payload
    const webhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      data: payload,
    };

    // Create signature if secret exists
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (secret) {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
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

    // Send webhook
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(webhookPayload),
    });

    // Log delivery
    await supabase.from('webhook_deliveries').insert({
      vendor_id: vendorId,
      event_type: eventType,
      url: targetUrl,
      payload: webhookPayload,
      status_code: response.status,
      success: response.ok,
    });

    console.log(`[dispatch-webhook] Webhook ${eventType} sent to ${targetUrl}, status: ${response.status}`);

    return new Response(
      JSON.stringify({ 
        success: response.ok,
        statusCode: response.status,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[dispatch-webhook] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
