/**
 * UTMify Conversion
 * 
 * RISE Protocol V3 - 10.0/10 Compliant
 * Uses 'users' table as SSOT for utmify_token lookup
 * 
 * Envia dados de conversão para o UTMify para tracking de campanhas
 * 
 * @category Tracking
 * @version 2.0.0 - Migrated from profiles to users (SSOT)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("UtmifyConversion");

const UTMIFY_API_URL = 'https://api.utmify.com.br/api/v1/conversion';

serve(async (req) => {
  // Handle CORS with dynamic origin validation
  const corsResult = handleCorsV2(req);
  
  if (corsResult instanceof Response) {
    return corsResult; // Preflight or blocked origin
  }
  
  const corsHeaders = corsResult.headers;

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
      log.error("Order not found:", orderId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // RISE V3: Use 'users' table as SSOT for utmify_token
    let token = utmifyToken;
    if (!token) {
      const { data: user } = await supabase
        .from('users')
        .select('utmify_token')
        .eq('id', vendorId)
        .single();
      token = user?.utmify_token;
    }

    if (!token) {
      log.info("No UTMify token configured for vendor:", vendorId);
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
      log.error("UTMify API error:", errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'UTMify API error' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Conversion sent for order ${orderId}`);

    return new Response(
      JSON.stringify({ success: true }),
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
