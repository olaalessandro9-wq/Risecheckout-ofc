/**
 * ============================================================================
 * RECONCILE-PENDING-ORDERS EDGE FUNCTION
 * ============================================================================
 * 
 * @version 2.0.0 - Zero `any` compliance (RISE Protocol V2)
 * 
 * Função de reconciliação automática para pedidos presos.
 * Executa a cada 5 minutos via scheduler externo.
 * 
 * ============================================================================
 * COMPORTAMENTO
 * ============================================================================
 * 
 * 1. Busca pedidos PENDING com created_at > 3 minutos
 * 2. Para cada pedido (máx 50 por execução):
 *    - Consulta status na API do gateway (MercadoPago, Asaas, etc.)
 *    - Se APPROVED: atualiza para PAID, concede acesso, dispara webhooks
 *    - Se REJECTED/CANCELLED: atualiza status correspondente
 * 3. Proteção de idempotência via order_events
 * 
 * ============================================================================
 * SEGURANÇA
 * ============================================================================
 * 
 * - Protegido por INTERNAL_WEBHOOK_SECRET
 * - Rate limiting para não estourar APIs de gateway
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const FUNCTION_VERSION = "2.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configurações
const MAX_ORDERS_PER_RUN = 50;
const MIN_AGE_MINUTES = 3;
const MAX_AGE_HOURS = 24; // Não reconcilia pedidos com mais de 24h

// ============================================================================
// TYPES
// ============================================================================

interface PendingOrder {
  id: string;
  vendor_id: string;
  product_id: string;
  gateway: string | null;
  gateway_payment_id: string | null;
  pix_id: string | null;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
  offer_id: string | null;
}

interface ReconcileResult {
  orderId: string;
  previousStatus: string;
  newStatus: string;
  action: 'updated' | 'skipped' | 'error';
  reason: string;
}

interface MercadoPagoPaymentStatus {
  status: 'approved' | 'pending' | 'rejected' | 'cancelled' | 'in_process' | 'refunded' | 'charged_back';
  status_detail: string;
  date_approved?: string;
}

interface AsaasPaymentStatus {
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE' | 'REFUNDED' | 'RECEIVED_IN_CASH' | 'REFUND_REQUESTED' | 'CHARGEBACK_REQUESTED' | 'CHARGEBACK_DISPUTE' | 'AWAITING_CHARGEBACK_REVERSAL' | 'DUNNING_REQUESTED' | 'DUNNING_RECEIVED' | 'AWAITING_RISK_ANALYSIS';
  confirmedDate?: string;
}

interface VaultCredentials {
  access_token: string;
  refresh_token?: string;
  token_expires_at?: string;
  mp_user_id?: string;
  mp_public_key?: string;
}

interface VaultRpcResponse {
  success: boolean;
  credentials?: VaultCredentials;
}

// ============================================================================
// LOGGING
// ============================================================================

function logInfo(message: string, data?: unknown) {
  console.log(`[reconcile-pending-orders] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logWarn(message: string, data?: unknown) {
  console.warn(`[reconcile-pending-orders] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: unknown) {
  console.error(`[reconcile-pending-orders] [ERROR] ${message}`, error);
}

// ============================================================================
// MERCADOPAGO API
// ============================================================================

async function getMercadoPagoPaymentStatus(
  paymentId: string, 
  accessToken: string
): Promise<MercadoPagoPaymentStatus | null> {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`MercadoPago API error: ${response.status}`, await response.text());
      return null;
    }

    const data = await response.json();
    return {
      status: data.status,
      status_detail: data.status_detail,
      date_approved: data.date_approved,
    };
  } catch (error: unknown) {
    logError('Erro ao consultar MercadoPago', error);
    return null;
  }
}

// ============================================================================
// ASAAS API
// ============================================================================

async function getAsaasPaymentStatus(
  paymentId: string,
  apiKey: string,
  sandbox: boolean = false
): Promise<AsaasPaymentStatus | null> {
  try {
    const baseUrl = sandbox ? 'https://sandbox.asaas.com/api/v3' : 'https://api.asaas.com/v3';
    const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`Asaas API error: ${response.status}`, await response.text());
      return null;
    }

    const data = await response.json();
    return {
      status: data.status,
      confirmedDate: data.confirmedDate,
    };
  } catch (error: unknown) {
    logError('Erro ao consultar Asaas', error);
    return null;
  }
}

// ============================================================================
// VAULT CREDENTIALS
// ============================================================================

async function getVaultCredentials(
  supabase: SupabaseClient,
  vendorId: string,
  gateway: string
): Promise<VaultCredentials | null> {
  try {
    const { data, error } = await supabase.rpc('get_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: gateway,
    });

    if (error) {
      logError(`Erro ao buscar credenciais do Vault`, error);
      return null;
    }

    const rpcResult = data as VaultRpcResponse | null;
    if (!rpcResult?.success || !rpcResult?.credentials) {
      return null;
    }

    return rpcResult.credentials;
  } catch (error: unknown) {
    logError('Erro ao acessar Vault', error);
    return null;
  }
}

// ============================================================================
// GRANT MEMBERS ACCESS (INLINE)
// ============================================================================

async function grantMembersAccessForOrder(
  supabase: SupabaseClient,
  order: PendingOrder
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se produto tem área de membros
    const { data: product } = await supabase
      .from('products')
      .select('id, name, members_area_enabled, user_id')
      .eq('id', order.product_id)
      .single();

    if (!product?.members_area_enabled) {
      logInfo('Produto não tem área de membros', { productId: order.product_id });
      return { success: true };
    }

    if (!order.customer_email) {
      return { success: false, error: 'Email do cliente não disponível' };
    }

    const normalizedEmail = order.customer_email.toLowerCase().trim();

    // Buscar ou criar buyer
    const { data: buyer } = await supabase
      .from('buyer_profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    let buyerId: string;

    if (!buyer) {
      const { data: newBuyer, error: createError } = await supabase
        .from('buyer_profiles')
        .insert({
          email: normalizedEmail,
          name: order.customer_name || null,
          password_hash: 'PENDING_PASSWORD_SETUP',
          is_active: true,
        })
        .select('id')
        .single();

      if (createError) {
        return { success: false, error: createError.message };
      }
      buyerId = newBuyer.id;
    } else {
      buyerId = buyer.id;
    }

    // Conceder acesso ao produto
    await supabase
      .from('buyer_product_access')
      .upsert({
        buyer_id: buyerId,
        product_id: order.product_id,
        order_id: order.id,
        is_active: true,
        access_type: 'purchase',
        granted_at: new Date().toISOString(),
      }, {
        onConflict: 'buyer_id,product_id',
      });

    // Buscar grupo padrão e atribuir
    const { data: defaultGroup } = await supabase
      .from('product_member_groups')
      .select('id')
      .eq('product_id', order.product_id)
      .eq('is_default', true)
      .single();

    if (defaultGroup?.id) {
      await supabase
        .from('buyer_groups')
        .upsert({
          buyer_id: buyerId,
          group_id: defaultGroup.id,
          is_active: true,
          granted_at: new Date().toISOString(),
        }, {
          onConflict: 'buyer_id,group_id',
        });
    }

    logInfo('Acesso à área de membros concedido', { orderId: order.id, buyerId });
    return { success: true };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Erro ao conceder acesso', error);
    return { success: false, error: errorMessage };
  }
}

// ============================================================================
// TRIGGER WEBHOOKS
// ============================================================================

async function triggerWebhooksForOrder(
  orderId: string,
  eventType: string
): Promise<void> {
  try {
    const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    if (!internalSecret || !supabaseUrl) {
      logWarn('INTERNAL_WEBHOOK_SECRET ou SUPABASE_URL não configurados');
      return;
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({
        order_id: orderId,
        event_type: eventType,
      }),
    });

    if (!response.ok) {
      logWarn('Erro ao disparar webhooks', { status: response.status });
    } else {
      logInfo('Webhooks disparados', { orderId, eventType });
    }
  } catch (error: unknown) {
    logError('Erro ao chamar trigger-webhooks', error);
  }
}

// ============================================================================
// RECONCILIATION LOGIC
// ============================================================================

async function reconcileOrder(
  supabase: SupabaseClient,
  order: PendingOrder
): Promise<ReconcileResult> {
  const orderId = order.id;
  const gateway = order.gateway?.toLowerCase();

  // Verificar se já foi processado (idempotência)
  const { data: existingEvent } = await supabase
    .from('order_events')
    .select('id')
    .eq('order_id', orderId)
    .eq('type', 'purchase_approved')
    .single();

  if (existingEvent) {
    return {
      orderId,
      previousStatus: order.status,
      newStatus: order.status,
      action: 'skipped',
      reason: 'Já possui evento purchase_approved',
    };
  }

  // Buscar credenciais do vendedor
  let paymentStatus: string | null = null;
  let dateApproved: string | null = null;

  if (gateway === 'mercadopago' && order.gateway_payment_id) {
    const creds = await getVaultCredentials(supabase, order.vendor_id, 'mercadopago');
    
    if (!creds?.access_token) {
      return {
        orderId,
        previousStatus: order.status,
        newStatus: order.status,
        action: 'error',
        reason: 'Credenciais MercadoPago não encontradas no Vault',
      };
    }

    const mpStatus = await getMercadoPagoPaymentStatus(order.gateway_payment_id, creds.access_token);
    
    if (!mpStatus) {
      return {
        orderId,
        previousStatus: order.status,
        newStatus: order.status,
        action: 'error',
        reason: 'Não foi possível consultar status no MercadoPago',
      };
    }

    paymentStatus = mpStatus.status;
    dateApproved = mpStatus.date_approved || null;

  } else if (gateway === 'asaas' && order.gateway_payment_id) {
    const creds = await getVaultCredentials(supabase, order.vendor_id, 'asaas');
    
    if (!creds?.access_token) {
      return {
        orderId,
        previousStatus: order.status,
        newStatus: order.status,
        action: 'error',
        reason: 'Credenciais Asaas não encontradas no Vault',
      };
    }

    const asaasStatus = await getAsaasPaymentStatus(order.gateway_payment_id, creds.access_token);
    
    if (!asaasStatus) {
      return {
        orderId,
        previousStatus: order.status,
        newStatus: order.status,
        action: 'error',
        reason: 'Não foi possível consultar status no Asaas',
      };
    }

    // Mapear status Asaas
    if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(asaasStatus.status)) {
      paymentStatus = 'approved';
      dateApproved = asaasStatus.confirmedDate || null;
    } else if (['OVERDUE', 'REFUNDED', 'CHARGEBACK_REQUESTED'].includes(asaasStatus.status)) {
      paymentStatus = 'rejected';
    } else {
      paymentStatus = 'pending';
    }

  } else if (gateway === 'pushinpay' && order.pix_id) {
    // PushinPay: verificar via pix_status já existente
    // Se ainda está pending, não há API para consultar
    return {
      orderId,
      previousStatus: order.status,
      newStatus: order.status,
      action: 'skipped',
      reason: 'PushinPay não suporta polling de status',
    };

  } else {
    return {
      orderId,
      previousStatus: order.status,
      newStatus: order.status,
      action: 'skipped',
      reason: `Gateway ${gateway} não suportado para reconciliação ou sem payment_id`,
    };
  }

  // Processar baseado no status
  if (paymentStatus === 'approved') {
    // Atualizar pedido para paid
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        pix_status: 'approved',
        paid_at: dateApproved || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (updateError) {
      return {
        orderId,
        previousStatus: order.status,
        newStatus: order.status,
        action: 'error',
        reason: `Erro ao atualizar pedido: ${updateError.message}`,
      };
    }

    // Registrar evento
    await supabase.from('order_events').insert({
      order_id: orderId,
      vendor_id: order.vendor_id,
      type: 'purchase_approved',
      occurred_at: new Date().toISOString(),
      data: {
        source: 'reconcile-pending-orders',
        gateway_status: paymentStatus,
        reconciled_at: new Date().toISOString(),
      },
    });

    // Conceder acesso à área de membros
    await grantMembersAccessForOrder(supabase, order);

    // Disparar webhooks
    await triggerWebhooksForOrder(orderId, 'purchase_approved');

    return {
      orderId,
      previousStatus: order.status,
      newStatus: 'paid',
      action: 'updated',
      reason: 'Pagamento confirmado via reconciliação',
    };

  } else if (paymentStatus && ['rejected', 'cancelled', 'refunded', 'charged_back'].includes(paymentStatus)) {
    const newStatus = paymentStatus === 'rejected' ? 'rejected' : 
                      paymentStatus === 'cancelled' ? 'cancelled' : 
                      paymentStatus === 'refunded' ? 'refunded' : 'chargeback';

    await supabase
      .from('orders')
      .update({
        status: newStatus,
        pix_status: paymentStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await supabase.from('order_events').insert({
      order_id: orderId,
      vendor_id: order.vendor_id,
      type: `purchase_${paymentStatus}`,
      occurred_at: new Date().toISOString(),
      data: {
        source: 'reconcile-pending-orders',
        gateway_status: paymentStatus,
      },
    });

    return {
      orderId,
      previousStatus: order.status,
      newStatus,
      action: 'updated',
      reason: `Status atualizado para ${newStatus}`,
    };

  } else {
    return {
      orderId,
      previousStatus: order.status,
      newStatus: order.status,
      action: 'skipped',
      reason: `Status ainda pendente: ${paymentStatus}`,
    };
  }
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  const startTime = Date.now();

  try {
    logInfo(`Versão ${FUNCTION_VERSION} iniciada`);

    // Validar autenticação
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      logError('Unauthorized: Invalid or missing X-Internal-Secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Setup Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase: SupabaseClient = createClient(supabaseUrl, serviceRoleKey);

    // Calcular janela de tempo
    const minAgeDate = new Date();
    minAgeDate.setMinutes(minAgeDate.getMinutes() - MIN_AGE_MINUTES);

    const maxAgeDate = new Date();
    maxAgeDate.setHours(maxAgeDate.getHours() - MAX_AGE_HOURS);

    // Buscar pedidos pendentes
    const { data: pendingOrders, error: queryError } = await supabase
      .from('orders')
      .select('id, vendor_id, product_id, gateway, gateway_payment_id, pix_id, status, customer_email, customer_name, offer_id')
      .eq('status', 'PENDING')
      .lt('created_at', minAgeDate.toISOString())
      .gt('created_at', maxAgeDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(MAX_ORDERS_PER_RUN);

    if (queryError) {
      throw new Error(`Erro ao buscar pedidos: ${queryError.message}`);
    }

    const typedOrders = (pendingOrders || []) as PendingOrder[];

    if (typedOrders.length === 0) {
      logInfo('Nenhum pedido pendente para reconciliar');
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Nenhum pedido pendente',
          processed: 0,
          duration_ms: Date.now() - startTime,
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    logInfo(`Encontrados ${typedOrders.length} pedidos para reconciliar`);

    // Processar cada pedido
    const results: ReconcileResult[] = [];

    for (const order of typedOrders) {
      // Rate limiting básico: 100ms entre cada pedido
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const result = await reconcileOrder(supabase, order);
      results.push(result);
      
      logInfo(`Pedido ${order.id}: ${result.action} - ${result.reason}`);
    }

    // Sumarizar resultados
    const summary = {
      total: results.length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      errors: results.filter(r => r.action === 'error').length,
    };

    logInfo('Reconciliação concluída', summary);

    return new Response(
      JSON.stringify({
        success: true,
        summary,
        results,
        duration_ms: Date.now() - startTime,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('Erro fatal', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage,
        duration_ms: Date.now() - startTime,
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
