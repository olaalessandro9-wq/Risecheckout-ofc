/**
 * Send Confirmation Email
 * 
 * RISE Protocol V3 - 10.0/10
 * 
 * Edge function para envio de email de confirmação de compra.
 * Utiliza o template unificado getPurchaseConfirmationTemplate.
 * 
 * @category Email
 * @status active
 * @version 2.0.0
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsV2 } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { getNoReplyEmail } from "../_shared/email-config.ts";
import { getPurchaseConfirmationTemplate, getPurchaseConfirmationTextTemplate } from "../_shared/email-templates-purchase.ts";
import type { PurchaseConfirmationData } from "../_shared/email-templates-base.ts";

const log = createLogger("SendConfirmationEmail");

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

    // Build template data
    const productName = ((order.product as unknown as { name: string }[]) || [])[0]?.name || 'Produto';
    
    const templateData: PurchaseConfirmationData = {
      customerName: order.customer_name || 'Cliente',
      productName,
      amountCents: order.amount_cents,
      orderId: order.id,
    };

    // Generate email using unified template
    const emailHtml = getPurchaseConfirmationTemplate(templateData);
    const emailText = getPurchaseConfirmationTextTemplate(templateData);

    // Send email via Resend (using centralized email config)
    const fromEmail = getNoReplyEmail();
    const fromName = Deno.env.get('ZEPTOMAIL_FROM_NAME') || 'Rise Checkout';
    
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: `${fromName} <${fromEmail}>`,
        to: order.customer_email,
        subject: 'Sua compra foi confirmada!',
        html: emailHtml,
        text: emailText,
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
