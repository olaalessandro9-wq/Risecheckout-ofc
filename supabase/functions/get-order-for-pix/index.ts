/**
 * Get Order for PIX
 * 
 * Retorna dados do pedido para exibição na tela de PIX
 * 
 * @category Orders
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

    const url = new URL(req.url);
    const orderId = url.searchParams.get('orderId');

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order with PIX data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        amount_cents,
        status,
        payment_method,
        pix_qr_code,
        pix_qr_code_base64,
        pix_expiration,
        customer_name,
        customer_email,
        created_at,
        product:products(id, name, image_url)
      `)
      .eq('id', orderId)
      .eq('payment_method', 'pix')
      .single();

    if (orderError || !order) {
      console.error('[get-order-for-pix] Order not found:', orderId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if PIX is expired
    const isExpired = order.pix_expiration 
      ? new Date(order.pix_expiration) < new Date()
      : false;

    console.log(`[get-order-for-pix] Order ${orderId} retrieved, status: ${order.status}`);

    return new Response(
      JSON.stringify({
        order: {
          id: order.id,
          amountCents: order.amount_cents,
          status: order.status,
          customerName: order.customer_name,
          customerEmail: order.customer_email,
          createdAt: order.created_at,
          product: order.product,
        },
        pix: {
          qrCode: order.pix_qr_code,
          qrCodeBase64: order.pix_qr_code_base64,
          expiration: order.pix_expiration,
          isExpired,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-order-for-pix] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
