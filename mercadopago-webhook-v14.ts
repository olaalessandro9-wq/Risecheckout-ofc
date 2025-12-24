import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

// Função auxiliar para criar HMAC
async function createHmacSignature(payload: any, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const keyData = encoder.encode(secret);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, data);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Função auxiliar para buscar pagamento com retry
async function fetchPaymentWithRetry(paymentId: string, accessToken: string, maxRetries = 3): Promise<any> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔍 Consultando pagamento no Mercado Pago (tentativa ${attempt}/${maxRetries})...`);
    
    const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    const payment = await mpResponse.json();

    if (mpResponse.ok) {
      return { ok: true, payment };
    }

    // Se for 404, aguardar e tentar novamente
    if (mpResponse.status === 404 && attempt < maxRetries) {
      console.log(`⏳ Pagamento não encontrado (404), aguardando ${attempt * 2} segundos antes de tentar novamente...`);
      await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // 2s, 4s, 6s
      continue;
    }

    // Outros erros ou última tentativa
    return { ok: false, status: mpResponse.status, payment };
  }

  return { ok: false, status: 404, payment: { message: 'Payment not found after retries' } };
}

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

    // Buscar pedido pelo gateway_payment_id
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .select('*')
      .eq('gateway_payment_id', paymentId.toString())
      .single();

    if (orderError || !order) {
      console.error('❌ Pedido não encontrado para payment_id:', paymentId, orderError);
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

    // Buscar detalhes do pagamento no Mercado Pago com retry
    const paymentResult = await fetchPaymentWithRetry(paymentId, access_token);

    if (!paymentResult.ok) {
      console.error('❌ Erro ao buscar pagamento no Mercado Pago:', paymentResult.payment);
      throw new Error('Erro ao buscar pagamento no Mercado Pago');
    }

    const payment = paymentResult.payment;

    console.log('💳 Status do pagamento no MP:', payment.status);
    console.log('💳 Status detail:', payment.status_detail);

    // Mapear status do Mercado Pago para status do RiseCheckout
    let orderStatus = order.status;
    let eventType = null;

    switch (payment.status) {
      case 'approved':
        orderStatus = 'PAID';
        eventType = 'purchase_approved';
        console.log('✅ Pagamento aprovado!');
        break;
      case 'pending':
      case 'in_process':
      case 'in_mediation':
        orderStatus = 'PENDING';
        eventType = 'pix_generated';
        console.log('⏳ Pagamento pendente');
        break;
      case 'rejected':
      case 'cancelled':
        orderStatus = 'CANCELLED';
        eventType = 'purchase_refused';
        console.log('❌ Pagamento rejeitado/cancelado');
        break;
      case 'refunded':
      case 'charged_back':
        orderStatus = 'REFUNDED';
        eventType = payment.status === 'charged_back' ? 'chargeback' : 'refund';
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

    // ✅ CORREÇÃO v13: Disparar webhooks diretamente sem depender de trigger-webhooks
    if (eventType) {
      console.log('🔔 Disparando webhooks do vendedor...');
      console.log('📋 Evento:', eventType);
      
      try {
        // Buscar webhooks ativos do vendedor
        const { data: webhooks, error: webhooksError } = await supabaseClient
          .from('outbound_webhooks')
          .select('*')
          .eq('vendor_id', vendorId)
          .eq('active', true)
          .contains('events', [eventType]);

        if (webhooksError) {
          console.error('⚠️ Erro ao buscar webhooks:', webhooksError);
        } else if (!webhooks || webhooks.length === 0) {
          console.log('ℹ️ Nenhum webhook configurado para este vendedor e evento');
        } else {
          console.log(`📤 Encontrados ${webhooks.length} webhook(s) para disparar`);

          // Buscar informações do produto
          let product = null;
          if (order.product_id) {
            const { data: productData } = await supabaseClient
              .from('products')
              .select('*')
              .eq('id', order.product_id)
              .single();
            product = productData;
          }

          // Construir payload
          const payload = {
            event: eventType,
            order_id: order.id,
            status: orderStatus,
            payment_provider: 'MERCADOPAGO',
            payment_id: paymentId,
            amount: order.amount_cents / 100,
            currency: order.currency || 'BRL',
            payment_method: order.payment_method || 'pix',
            customer: {
              email: order.customer_email,
              name: order.customer_name
            },
            product: product ? {
              id: product.id,
              name: product.name
            } : null,
            created_at: order.created_at,
            updated_at: new Date().toISOString(),
            timestamp: new Date().toISOString()
          };

          // Disparar para cada webhook
          for (const webhook of webhooks) {
            try {
              console.log(`📤 Enviando para: ${webhook.url}`);

              // Criar assinatura HMAC
              const signature = await createHmacSignature(payload, webhook.secret || '');

              // Enviar webhook
              const webhookResponse = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'X-Rise-Signature': signature,
                  'X-Rise-Event': eventType
                },
                body: JSON.stringify(payload)
              });

              const responseBody = await webhookResponse.text();
              const isSuccess = webhookResponse.ok;

              console.log(`${isSuccess ? '✅' : '❌'} Webhook ${webhook.name}: ${webhookResponse.status}`);

              // Registrar entrega
              await supabaseClient
                .from('webhook_deliveries')
                .insert({
                  webhook_id: webhook.id,
                  order_id: order.id,
                  event_type: eventType,
                  payload: payload,
                  status: isSuccess ? 'success' : 'failed',
                  attempts: 1,
                  response_status: webhookResponse.status,
                  response_body: responseBody.substring(0, 1000), // Limitar tamanho
                  last_attempt_at: new Date().toISOString()
                });

            } catch (webhookError) {
              console.error(`❌ Erro ao enviar webhook ${webhook.name}:`, webhookError);
              
              // Registrar falha
              await supabaseClient
                .from('webhook_deliveries')
                .insert({
                  webhook_id: webhook.id,
                  order_id: order.id,
                  event_type: eventType,
                  payload: payload,
                  status: 'failed',
                  attempts: 1,
                  response_status: 0,
                  response_body: webhookError.message,
                  last_attempt_at: new Date().toISOString()
                });
            }
          }

          console.log('✅ Webhooks processados com sucesso');
        }
      } catch (webhookError) {
        console.error('⚠️ Erro ao processar webhooks:', webhookError);
        // Não falhar o webhook principal se o webhook do vendedor falhar
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
