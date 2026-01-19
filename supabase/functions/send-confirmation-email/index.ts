/**
 * Send Confirmation Email
 * 
 * Envia email de confirmação de compra
 * 
 * @category Email
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

const log = createLogger("SendConfirmationEmail");
const corsHeaders = PUBLIC_CORS_HEADERS;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!resendApiKey) {
      log.error("RESEND_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: 'Email service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { orderId } = await req.json();

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: 'orderId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get order with product details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        amount_cents,
        status,
        product:products(name, image_url)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      log.error("Order not found:", orderId);
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!order.customer_email) {
      return new Response(
        JSON.stringify({ error: 'No customer email' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Confirmação de Compra</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Compra Confirmada! 🎉</h1>
          <p>Olá ${order.customer_name || 'Cliente'},</p>
          <p>Sua compra foi confirmada com sucesso!</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes do Pedido</h3>
            <p><strong>Produto:</strong> ${((order.product as unknown as { name: string }[]) || [])[0]?.name || 'N/A'}</p>
            <p><strong>Valor:</strong> R$ ${(order.amount_cents / 100).toFixed(2)}</p>
            <p><strong>Pedido:</strong> #${order.id.slice(0, 8)}</p>
          </div>
          
          <p>Você receberá as instruções de acesso em breve.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 40px;">
            Este é um email automático. Por favor, não responda.
          </p>
        </body>
      </html>
    `;

    // Send email via Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Rise Checkout <noreply@risecheckout.com>',
        to: order.customer_email,
        subject: 'Compra Confirmada! 🎉',
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      log.error("Resend error:", errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Email sent for order ${orderId}`);

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
