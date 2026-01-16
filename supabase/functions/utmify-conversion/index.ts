/**
 * UTMify Conversion
 * 
 * Envia dados de conversão para o UTMify para tracking de campanhas
 * 
 * @category Tracking
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const UTMIFY_API_URL = 'https://api.utmify.com.br/api/v1/conversion';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { 
      orderId, 
      vendorId, 
      utmifyToken,
      conversionData 
    } = await req.json();

    if (!orderId || !vendorId) {
      return new Response(
        JSON.stringify({ error: 'orderId and vendorId are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[utmify-conversion] Order not found:', orderId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get UTMify token from vendor profile if not provided
    let token = utmifyToken;
    if (!token) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('utmify_token')
        .eq('id', vendorId)
        .single();
      token = profile?.utmify_token;
    }

    if (!token) {
      console.log('[utmify-conversion] No UTMify token configured for vendor:', vendorId);
      return new Response(
        JSON.stringify({ success: false, reason: 'No UTMify token configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send conversion to UTMify
    const utmifyPayload = {
      transaction_id: orderId,
      value: order.amount_cents / 100,
      currency: 'BRL',
      email: order.customer_email,
      ...conversionData,
    };

    const utmifyResponse = await fetch(UTMIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(utmifyPayload),
    });

    if (!utmifyResponse.ok) {
      const errorData = await utmifyResponse.text();
      console.error('[utmify-conversion] UTMify API error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'UTMify API error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[utmify-conversion] Conversion sent for order ${orderId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[utmify-conversion] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
