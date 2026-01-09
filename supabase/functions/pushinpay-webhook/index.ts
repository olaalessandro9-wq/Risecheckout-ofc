/**
 * ============================================================================
 * PUSHINPAY-WEBHOOK EDGE FUNCTION
 * ============================================================================
 * 
 * Versão: 3
 * Data de Criação: 2025-12-17
 * Última Atualização: 2025-12-17
 * Status: ✅ Corrigido para usar pix_id (lowercase)
 * 
 * ============================================================================
 * CORREÇÕES APLICADAS (v3):
 * - Busca por pix_id ao invés de payment_id (coluna não existe)
 * - Normaliza ID para lowercase (PushinPay envia uppercase)
 * - Adiciona paid_at quando status = paid
 * - Dispara webhooks via trigger-webhooks com event_type correto
 * ============================================================================
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendOrderConfirmationEmails, type OrderData } from '../_shared/send-order-emails.ts';
import { logSecurityEvent, SecurityAction } from '../_shared/audit-logger.ts';

const FUNCTION_VERSION = "3";

// ========================================================================
// TYPES & INTERFACES
// ========================================================================

interface PushinPayWebhookBody {
  id: string;
  status: 'created' | 'paid' | 'canceled' | 'expired';
  value?: number;
  end_to_end_id?: string | null;
  payer_name?: string | null;
  payer_national_registration?: string | null;
  webhook_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

// ========================================================================
// CONSTANTS
// ========================================================================

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pushinpay-token'
};

// ========================================================================
// HELPER FUNCTIONS
// ========================================================================

function logInfo(message: string, data?: any) {
  console.log(`[pushinpay-webhook] [v${FUNCTION_VERSION}] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: any) {
  console.error(`[pushinpay-webhook] [v${FUNCTION_VERSION}] [ERROR] ${message}`, error);
}

function logWarn(message: string, data?: any) {
  console.warn(`[pushinpay-webhook] [v${FUNCTION_VERSION}] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

function createResponse(success: boolean, message: string, status: number, extra?: any) {
  return new Response(JSON.stringify({ success, message, ...extra }), {
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    status
  });
}

// ========================================================================
// MAIN HANDLER
// ========================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    logInfo('========== WEBHOOK RECEBIDO ==========');

    // ========================================================================
    // 1. VALIDATE TOKEN
    // ========================================================================
    
    const receivedToken = req.headers.get('x-pushinpay-token');
    const expectedToken = Deno.env.get('PUSHINPAY_WEBHOOK_TOKEN');

    logInfo('Validação de token', { 
      tokenRecebido: receivedToken ? 'presente' : 'ausente',
      tokenConfigurado: expectedToken ? 'sim' : 'NÃO'
    });

    if (!expectedToken) {
      logError('PUSHINPAY_WEBHOOK_TOKEN não configurado!');
      return createResponse(false, 'Webhook token not configured', 500);
    }

    if (!receivedToken || receivedToken !== expectedToken) {
      logWarn('Token inválido ou ausente');
      return createResponse(false, 'Unauthorized', 401);
    }

    logInfo('✅ Token validado com sucesso');

    // ========================================================================
    // 2. PARSE REQUEST
    // ========================================================================
    
    let body: PushinPayWebhookBody;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      const valueStr = params.get('value');
      body = {
        id: params.get('id') || '',
        status: (params.get('status') as PushinPayWebhookBody['status']) || 'created',
        value: valueStr ? parseInt(valueStr, 10) : undefined,
        end_to_end_id: params.get('end_to_end_id') || undefined,
        payer_name: params.get('payer_name') || undefined,
        payer_national_registration: params.get('payer_national_registration') || undefined,
      };
    } else {
      body = await req.json();
    }

    logInfo('Payload recebido', { 
      id_original: body.id, 
      status: body.status,
      value: body.value 
    });

    if (!body.id) {
      return createResponse(false, 'Missing payment ID', 400);
    }

    // ✅ CORREÇÃO CRÍTICA: Normalizar ID para lowercase
    // PushinPay envia UUID em UPPERCASE, mas salvamos em lowercase no pix_id
    const paymentId = body.id.toLowerCase();
    logInfo('ID normalizado para lowercase', { original: body.id, normalizado: paymentId });

    // ========================================================================
    // 3. INITIALIZE SUPABASE
    // ========================================================================
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ========================================================================
    // 4. FIND ORDER BY pix_id (não payment_id!)
    // ========================================================================

    logInfo('Buscando pedido por pix_id', { pix_id: paymentId });

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('pix_id', paymentId)
      .single();

    if (orderError || !order) {
      logError('Pedido não encontrado por pix_id', { pix_id: paymentId, error: orderError?.message });
      return createResponse(false, 'Order not found', 404, { pix_id: paymentId });
    }

    logInfo('✅ Pedido encontrado', { 
      order_id: order.id, 
      status_atual: order.status,
      vendor_id: order.vendor_id
    });

    // ========================================================================
    // 5. PROCESS STATUS
    // ========================================================================

    // Ignorar evento created (PIX já foi criado antes)
    if (body.status === 'created') {
      logInfo('Evento created recebido - apenas log');
      return createResponse(true, 'Event logged', 200);
    }

    // Evitar reprocessamento se já está paid
    if (body.status === 'paid' && order.status?.toUpperCase() === 'PAID') {
      logWarn('Pedido já está PAID - ignorando duplicata');
      return createResponse(true, 'Already processed', 200);
    }

    // Mapear status do PushinPay para status interno
    let newStatus: string;
    let shouldTriggerWebhook = false;
    let webhookEventType: string | null = null;

    switch (body.status) {
      case 'paid':
        newStatus = 'PAID';
        shouldTriggerWebhook = true;
        webhookEventType = 'purchase_approved';
        break;
      case 'expired':
        newStatus = 'EXPIRED';
        break;
      case 'canceled':
        newStatus = 'CANCELLED';
        break;
      default:
        logWarn('Status desconhecido', { status: body.status });
        return createResponse(true, `Unknown status: ${body.status}`, 200);
    }

    logInfo('Atualizando pedido', { order_id: order.id, old_status: order.status, new_status: newStatus });

    // ========================================================================
    // 6. UPDATE ORDER
    // ========================================================================

    const updateData: any = {
      status: newStatus,
      pix_status: body.status,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'PAID') {
      updateData.paid_at = new Date().toISOString();
    }

    // Salvar dados do pagador se disponíveis
    if (body.payer_name && !order.customer_name) {
      updateData.customer_name = body.payer_name;
    }
    if (body.payer_national_registration && !order.customer_document) {
      updateData.customer_document = body.payer_national_registration;
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id);

    if (updateError) {
      logError('Erro ao atualizar pedido', updateError);
      return createResponse(false, 'Failed to update order', 500);
    }

    logInfo('✅ Pedido atualizado com sucesso');

    // SECURITY: Log payment approval
    if (newStatus === 'PAID') {
      await logSecurityEvent(supabase, {
        userId: order.vendor_id,
        action: SecurityAction.PROCESS_PAYMENT,
        resource: "orders",
        resourceId: order.id,
        success: true,
        metadata: { 
          gateway: "pushinpay",
          payment_status: body.status,
          pix_id: paymentId,
          payer_name: body.payer_name || null
        }
      });
    }

    // ========================================================================
    // 6.1 SEND CONFIRMATION EMAILS (um para cada item do pedido)
    // ========================================================================

    if (newStatus === 'PAID' && order.customer_email) {
      logInfo('Enviando emails de confirmação para todos os itens do pedido', { 
        orderId: order.id,
        email: order.customer_email 
      });

      try {
        const orderData: OrderData = {
          id: order.id,
          customer_name: order.customer_name || body.payer_name || null,
          customer_email: order.customer_email,
          amount_cents: order.amount_cents,
          product_id: order.product_id,
          product_name: order.product_name,
        };

        const emailResult = await sendOrderConfirmationEmails(
          supabase,
          orderData,
          'PIX / PushinPay'
        );

        logInfo('✅ Resultado do envio de emails', {
          totalItems: emailResult.totalItems,
          emailsSent: emailResult.emailsSent,
          emailsFailed: emailResult.emailsFailed
        });
      } catch (emailError) {
        logWarn('⚠️ Exceção ao enviar emails (não crítico)', emailError);
      }
    }

    // ========================================================================
    // 7. TRIGGER VENDOR WEBHOOKS
    // ========================================================================

    if (shouldTriggerWebhook && webhookEventType) {
      logInfo('Disparando webhooks do vendedor', { event_type: webhookEventType });

      // 🔒 SEGURANÇA P0: Não usar secret hardcoded - exigir configuração
      const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
      
      if (!internalSecret) {
        logWarn('⚠️ INTERNAL_WEBHOOK_SECRET não configurado - pulando trigger de webhooks externos');
        logWarn('Configure o secret em Supabase > Settings > Edge Functions > Secrets');
      } else {
        try {
          const webhookResponse = await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Internal-Secret': internalSecret,
            },
            body: JSON.stringify({
              order_id: order.id,
              event_type: webhookEventType,
            }),
          });

          logInfo('Resposta trigger-webhooks', { status: webhookResponse.status });

          if (!webhookResponse.ok) {
            const errorText = await webhookResponse.text();
            logWarn('Erro ao disparar webhooks', { error: errorText });
          } else {
            logInfo('✅ Webhooks disparados com sucesso');
          }
        } catch (webhookError) {
          logWarn('Exceção ao disparar webhooks', webhookError);
        }
      }
    }

    // ========================================================================
    // 8. LOG EVENT
    // ========================================================================

    try {
      await supabase.from('order_events').insert({
        order_id: order.id,
        vendor_id: order.vendor_id,
        type: `pushinpay_${body.status}`,
        occurred_at: new Date().toISOString(),
        data: { 
          status: body.status, 
          payer_name: body.payer_name,
          payer_document: body.payer_national_registration,
          source: 'pushinpay_webhook',
          version: FUNCTION_VERSION
        },
      });
      logInfo('✅ Evento registrado');
    } catch (eventError) {
      logWarn('Erro ao registrar evento', eventError);
    }

    logInfo('========== WEBHOOK PROCESSADO ==========');

    return createResponse(true, 'Webhook processed successfully', 200, {
      order_id: order.id,
      new_status: newStatus,
      webhook_triggered: shouldTriggerWebhook,
    });

  } catch (error: any) {
    logError('Erro geral', error);
    return createResponse(false, error.message || 'Internal server error', 500);
  }
});
