/**
 * Send Webhook
 * 
 * Função simplificada para envio de webhook HTTP
 * 
 * @category Webhooks
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";

const corsHeaders = PUBLIC_CORS_HEADERS;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, method = 'POST', headers = {}, body } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'url is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    console.log(`[send-webhook] ${method} ${url} - Status: ${response.status}`);

    return new Response(
      JSON.stringify({
        success: response.ok,
        statusCode: response.status,
        data: responseData,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[send-webhook] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
