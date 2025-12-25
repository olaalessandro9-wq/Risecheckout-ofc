/**
 * ============================================================================
 * ASAAS WEBHOOK - Edge Function
 * ============================================================================
 * 
 * Recebe eventos de pagamento do Asaas e atualiza status das ordens.
 * 
 * @module asaas-webhook
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { logSecurityEvent, SecurityAction } from "../_shared/audit-logger.ts";
import { sendEmail } from '../_shared/zeptomail.ts';
import { getPurchaseConfirmationTemplate, getPurchaseConfirmationTextTemplate, type PurchaseConfirmationData } from '../_shared/email-templates.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, asaas-access-token',
};

// URL dinâmica via env (corrigido de hardcoded)
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const ASAAS_WEBHOOK_TOKEN = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || '';

interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer: string;
    billingType: string;
    value: number;
    status: string;
    externalReference?: string;
    description?: string;
    confirmedDate?: string;
    paymentDate?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Validar token do webhook
    const authHeader = req.headers.get('asaas-access-token') || '';
    
    if (!ASAAS_WEBHOOK_TOKEN) {
      console.error('[asaas-webhook] ASAAS_WEBHOOK_TOKEN não configurado');
      return new Response(
        JSON.stringify({ error: 'Webhook token não configurado' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (authHeader !== ASAAS_WEBHOOK_TOKEN) {
      console.error('[asaas-webhook] Token inválido');
      
      // Audit log para tentativa inválida
      await logSecurityEvent(supabase, {
        userId: '00000000-0000-0000-0000-000000000000',
        action: SecurityAction.ACCESS_DENIED,
        resource: 'asaas-webhook',
        success: false,
        request: req,
        metadata: { reason: 'Invalid webhook token' }
      });
      
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: AsaasWebhookEvent = await req.json();
    console.log('[asaas-webhook] Evento recebido:', JSON.stringify(event, null, 2));

    const { event: eventType, payment } = event;

    if (!payment) {
      console.log('[asaas-webhook] Evento sem payment, ignorando');
      return new Response(
        JSON.stringify({ received: true, message: 'Evento sem payment' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Eventos relevantes de pagamento
    const relevantEvents = [
      'PAYMENT_CONFIRMED',
      'PAYMENT_RECEIVED',
      'PAYMENT_OVERDUE',
      'PAYMENT_REFUNDED',
      'PAYMENT_DELETED',
      'PAYMENT_UPDATED',
      'PAYMENT_CREATED'
    ];

    if (!relevantEvents.includes(eventType)) {
      console.log(`[asaas-webhook] Evento ${eventType} não processado`);
      return new Response(
        JSON.stringify({ received: true, message: `Evento ${eventType} não processado` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mapear status Asaas para status interno
    const statusMap: Record<string, string> = {
      'PENDING': 'pending',
      'RECEIVED': 'paid',
      'CONFIRMED': 'paid',
      'OVERDUE': 'expired',
      'REFUNDED': 'refunded',
      'RECEIVED_IN_CASH': 'paid',
      'REFUND_REQUESTED': 'refund_requested',
      'REFUND_IN_PROGRESS': 'refund_in_progress',
      'CHARGEBACK_REQUESTED': 'chargeback',
      'CHARGEBACK_DISPUTE': 'chargeback_dispute',
      'AWAITING_RISK_ANALYSIS': 'pending',
      'DUNNING_REQUESTED': 'pending',
      'DUNNING_RECEIVED': 'paid'
    };

    const internalStatus = statusMap[payment.status] || 'pending';
    const orderId = payment.externalReference;

    if (!orderId) {
      console.log('[asaas-webhook] Payment sem externalReference (orderId)');
      return new Response(
        JSON.stringify({ received: true, message: 'Payment sem orderId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[asaas-webhook] Atualizando order ${orderId} para status ${internalStatus}`);

    // Buscar ordem para obter vendor_id e dados para email
    const { data: orderData } = await supabase
      .from('orders')
      .select('vendor_id, customer_email, customer_name, product_name, amount_cents')
      .eq('id', orderId)
      .single();

    const vendorId = orderData?.vendor_id || '00000000-0000-0000-0000-000000000000';

    const updateData: Record<string, unknown> = {
      status: internalStatus,
      gateway_payment_id: payment.id,
      updated_at: new Date().toISOString()
    };

    // Se pagamento confirmado, adicionar data
    if (internalStatus === 'paid') {
      updateData.paid_at = payment.confirmedDate || payment.paymentDate || new Date().toISOString();
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId);

    if (updateError) {
      console.error('[asaas-webhook] Erro ao atualizar order:', updateError);
      return new Response(
        JSON.stringify({ error: 'Erro ao atualizar order' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Enviar email de confirmação se pagamento aprovado
    if (internalStatus === 'paid' && orderData?.customer_email) {
      console.log('[asaas-webhook] Enviando email de confirmação');
      try {
        const emailData: PurchaseConfirmationData = {
          customerName: orderData.customer_name || 'Cliente',
          productName: orderData.product_name || 'Produto',
          amountCents: orderData.amount_cents,
          orderId: orderId,
          paymentMethod: payment.billingType === 'PIX' ? 'PIX / Asaas' : 'Asaas',
        };

        const emailResult = await sendEmail({
          to: { email: orderData.customer_email, name: orderData.customer_name || undefined },
          subject: `✅ Compra Confirmada - ${orderData.product_name || 'Seu Pedido'}`,
          htmlBody: getPurchaseConfirmationTemplate(emailData),
          textBody: getPurchaseConfirmationTextTemplate(emailData),
          type: 'transactional',
          clientReference: `order_${orderId}_confirmation`,
        });

        if (emailResult.success) {
          console.log('[asaas-webhook] ✅ Email de confirmação enviado:', emailResult.messageId);
        } else {
          console.warn('[asaas-webhook] ⚠️ Falha ao enviar email (não crítico):', emailResult.error);
        }
      } catch (emailError) {
        console.warn('[asaas-webhook] ⚠️ Exceção ao enviar email (não crítico):', emailError);
      }
    }

    // Registrar evento
    const { error: eventError } = await supabase
      .from('order_events')
      .insert({
        order_id: orderId,
        type: `asaas.${eventType.toLowerCase()}`,
        data: event,
        gateway_event_id: payment.id,
        occurred_at: new Date().toISOString(),
        vendor_id: vendorId
      });

    if (eventError) {
      console.warn('[asaas-webhook] Erro ao registrar evento (não crítico):', eventError);
    }

    // Audit log para pagamento processado
    await logSecurityEvent(supabase, {
      userId: vendorId,
      action: SecurityAction.PROCESS_PAYMENT,
      resource: 'orders',
      resourceId: orderId,
      success: true,
      request: req,
      metadata: {
        gateway: 'asaas',
        eventType,
        paymentId: payment.id,
        oldStatus: 'unknown',
        newStatus: internalStatus,
        value: payment.value
      }
    });

    console.log(`[asaas-webhook] Order ${orderId} atualizada com sucesso para ${internalStatus}`);

    return new Response(
      JSON.stringify({ 
        received: true, 
        orderId, 
        status: internalStatus,
        asaasPaymentId: payment.id 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[asaas-webhook] Exception:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
