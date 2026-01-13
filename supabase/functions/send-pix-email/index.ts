/**
 * Send PIX Email
 * 
 * Envia email com dados do PIX para pagamento
 * 
 * @category Email
 * @status stub - migrado do deploy
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
      console.error('[send-pix-email] RESEND_API_KEY not configured');
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

    // Get order with PIX data
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        customer_name,
        customer_email,
        amount_cents,
        pix_qr_code,
        pix_expiration,
        product:products(name)
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      console.error('[send-pix-email] Order not found:', orderId);
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

    if (!order.pix_qr_code) {
      return new Response(
        JSON.stringify({ error: 'No PIX data available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build email HTML
    const expirationDate = order.pix_expiration 
      ? new Date(order.pix_expiration).toLocaleString('pt-BR')
      : 'N/A';

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Pagamento PIX</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333;">Pague com PIX 💰</h1>
          <p>Olá ${order.customer_name || 'Cliente'},</p>
          <p>Seu pedido foi gerado! Complete o pagamento via PIX.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Detalhes do Pedido</h3>
            <p><strong>Produto:</strong> ${((order.product as unknown as { name: string }[]) || [])[0]?.name || 'N/A'}</p>
            <p><strong>Valor:</strong> R$ ${(order.amount_cents / 100).toFixed(2)}</p>
            <p><strong>Expira em:</strong> ${expirationDate}</p>
          </div>
          
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Código PIX (Copia e Cola)</h3>
            <p style="word-break: break-all; font-family: monospace; font-size: 12px; background: white; padding: 10px; border-radius: 4px;">
              ${order.pix_qr_code}
            </p>
          </div>
          
          <p><strong>Como pagar:</strong></p>
          <ol>
            <li>Abra o app do seu banco</li>
            <li>Selecione "Pagar com PIX"</li>
            <li>Escolha "PIX Copia e Cola"</li>
            <li>Cole o código acima e confirme</li>
          </ol>
          
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
        subject: `Pague R$ ${(order.amount_cents / 100).toFixed(2)} via PIX 💰`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error('[send-pix-email] Resend error:', errorData);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[send-pix-email] PIX email sent for order ${orderId}`);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[send-pix-email] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
