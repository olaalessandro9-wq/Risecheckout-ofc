import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
    const body = await req.json();
    console.log('Webhook recebido do Mercado Pago:', body);
    // Mercado Pago envia notificações de diferentes tipos
    // Vamos processar apenas notificações de pagamento
    if (body.type !== 'payment') {
      return new Response('OK', {
        status: 200
      });
    }
    const paymentId = body.data?.id;
    if (!paymentId) {
      throw new Error('ID do pagamento não fornecido');
    }
    // Buscar pedido pelo payment_provider_id
    const { data: order, error: orderError } = await supabaseClient.from('orders').select('*, checkouts(vendor_id)').eq('payment_provider_id', paymentId.toString()).single();
    if (orderError || !order) {
      console.error('Pedido não encontrado para payment_id:', paymentId);
      return new Response('OK', {
        status: 200
      });
    }
    const vendorId = order.checkouts.vendor_id;
    // Buscar credenciais do Mercado Pago
    const { data: integration } = await supabaseClient.from('vendor_integrations').select('*').eq('vendor_id', vendorId).eq('integration_type', 'MERCADOPAGO').eq('active', true).single();
    if (!integration) {
      throw new Error('Integração do Mercado Pago não encontrada');
    }
    const { access_token } = integration.config;
    // Buscar detalhes do pagamento no Mercado Pago
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    const payment = await mpResponse.json();
    if (!mpResponse.ok) {
      throw new Error('Erro ao buscar pagamento no Mercado Pago');
    }
    console.log('Status do pagamento:', payment.status);
    // Mapear status do Mercado Pago para status do RiseCheckout
    let orderStatus = order.status;
    let paymentStatus = 'PENDING';
    switch(payment.status){
      case 'approved':
        orderStatus = 'PAID';
        paymentStatus = 'PAID';
        break;
      case 'pending':
      case 'in_process':
        orderStatus = 'PENDING';
        paymentStatus = 'PENDING';
        break;
      case 'rejected':
      case 'cancelled':
        orderStatus = 'CANCELLED';
        paymentStatus = 'FAILED';
        break;
      case 'refunded':
      case 'charged_back':
        orderStatus = 'REFUNDED';
        paymentStatus = 'REFUNDED';
        break;
    }
    // Atualizar pedido
    await supabaseClient.from('orders').update({
      status: orderStatus,
      payment_status: paymentStatus,
      updated_at: new Date().toISOString()
    }).eq('id', order.id);
    // Se o pagamento foi aprovado, disparar webhook do vendedor
    if (payment.status === 'approved' && orderStatus === 'PAID') {
      // Buscar webhook configurado
      const { data: webhook } = await supabaseClient.from('vendor_integrations').select('*').eq('vendor_id', vendorId).eq('integration_type', 'WEBHOOK').eq('active', true).single();
      if (webhook && webhook.config?.webhook_url) {
        // Disparar webhook (não aguardar resposta)
        fetch(webhook.config.webhook_url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            event: 'order.paid',
            order_id: order.id,
            payment_provider: 'MERCADOPAGO',
            payment_id: paymentId,
            amount: order.total_amount,
            timestamp: new Date().toISOString()
          })
        }).catch((err)=>console.error('Erro ao disparar webhook:', err));
      }
    }
    return new Response('OK', {
      headers: corsHeaders,
      status: 200
    });
  } catch (error) {
    console.error('Erro no webhook:', error);
    return new Response('OK', {
      headers: corsHeaders,
      status: 200
    });
  }
});
