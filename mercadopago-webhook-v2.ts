import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    console.log('🔔 Webhook recebido do Mercado Pago:', JSON.stringify(body, null, 2));

    // Mercado Pago envia notificações de diferentes tipos
    // Tipos possíveis: payment, merchant_order, plan, subscription, invoice, point_integration_wh
    if (body.type !== 'payment') {
      console.log('ℹ️ Tipo de notificação ignorado:', body.type);
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    const paymentId = body.data?.id;
    if (!paymentId) {
      console.error('❌ ID do pagamento não fornecido no webhook');
      throw new Error('ID do pagamento não fornecido');
    }

    console.log('🔍 Buscando pedido com payment_id:', paymentId);

    // Buscar pedido pelo gateway_payment_id (campo correto)
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('gateway_payment_id', paymentId.toString())
      .single();

    if (orderError || !order) {
      console.error('❌ Pedido não encontrado para payment_id:', paymentId, orderError);
      // Retornar 200 para não ficar recebendo retry do MP
      return new Response('OK', { status: 200, headers: corsHeaders });
    }

    console.log('✅ Pedido encontrado:', order.id);

    const vendorId = order.vendor_id;

    // Buscar credenciais do Mercado Pago
    const { data: integration, error: integrationError } = await supabaseClient
      .from('vendor_integrations')
      .select('*')
      .eq('vendor_id', vendorId)
      .eq('integration_type', 'MERCADOPAGO')
      .eq('active', true)
      .single();

    if (integrationError || !integration) {
      console.error('❌ Integração do Mercado Pago não encontrada:', integrationError);
      throw new Error('Integração do Mercado Pago não encontrada');
    }

    const { access_token } = integration.config;

    // Buscar detalhes do pagamento no Mercado Pago
    console.log('🔍 Consultando pagamento no Mercado Pago...');
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const payment = await mpResponse.json();

    if (!mpResponse.ok) {
      console.error('❌ Erro ao buscar pagamento no Mercado Pago:', payment);
      throw new Error('Erro ao buscar pagamento no Mercado Pago');
    }

    console.log('💳 Status do pagamento no MP:', payment.status);
    console.log('💳 Status detail:', payment.status_detail);

    // Mapear status do Mercado Pago para status do RiseCheckout
    let orderStatus = order.status;
    let paymentStatus = 'PENDING';

    switch (payment.status) {
      case 'approved':
        orderStatus = 'PAID';
        paymentStatus = 'PAID';
        console.log('✅ Pagamento aprovado!');
        break;
      case 'pending':
      case 'in_process':
      case 'in_mediation':
        orderStatus = 'PENDING';
        paymentStatus = 'PENDING';
        console.log('⏳ Pagamento pendente');
        break;
      case 'rejected':
      case 'cancelled':
        orderStatus = 'CANCELLED';
        paymentStatus = 'FAILED';
        console.log('❌ Pagamento rejeitado/cancelado');
        break;
      case 'refunded':
      case 'charged_back':
        orderStatus = 'REFUNDED';
        paymentStatus = 'REFUNDED';
        console.log('💸 Pagamento estornado');
        break;
      default:
        console.log('⚠️ Status desconhecido:', payment.status);
    }

    // Atualizar pedido
    console.log('💾 Atualizando pedido:', order.id, '- Status:', orderStatus);
    const { error: updateError } = await supabaseClient
      .from('orders')
      .update({
        status: orderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id);

    if (updateError) {
      console.error('❌ Erro ao atualizar pedido:', updateError);
      throw updateError;
    }

    console.log('✅ Pedido atualizado com sucesso!');

    // Se o pagamento foi aprovado, disparar webhook do vendedor
    if (payment.status === 'approved' && orderStatus === 'PAID') {
      console.log('🔔 Disparando webhook do vendedor...');
      
      // Buscar webhook configurado
      const { data: webhook } = await supabaseClient
        .from('vendor_integrations')
        .select('*')
        .eq('vendor_id', vendorId)
        .eq('integration_type', 'WEBHOOK')
        .eq('active', true)
        .single();

      if (webhook && webhook.config?.webhook_url) {
        console.log('📤 Enviando para:', webhook.config.webhook_url);
        
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
            amount: order.amount,
            customer_email: order.customer_email,
            customer_name: order.customer_name,
            product_name: order.product_name,
            timestamp: new Date().toISOString()
          })
        }).catch((err) => console.error('❌ Erro ao disparar webhook:', err));
      } else {
        console.log('ℹ️ Nenhum webhook configurado para este vendedor');
      }
    }

    return new Response(JSON.stringify({ success: true, order_id: order.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('❌ Erro no webhook:', error);
    
    // Retornar 200 para evitar retry infinito do Mercado Pago
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  }
});
