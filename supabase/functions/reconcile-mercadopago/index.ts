/**
 * ============================================================================
 * RECONCILE-MERCADOPAGO EDGE FUNCTION
 * ============================================================================
 * 
 * @version 2.0.0 - RISE Protocol V3 - Modelo Hotmart/Kiwify
 * 
 * PADRÃO DE MERCADO: Uma venda pendente NUNCA vira "cancelada".
 * rejected/cancelled = status continua PENDING + technical_status atualizado.
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ============================================================================
// TYPES
// ============================================================================

interface PendingOrder {
  id: string;
  vendor_id: string;
  product_id: string;
  gateway_payment_id: string;
  status: string;
  customer_email: string | null;
  customer_name: string | null;
}

interface ReconcileResult {
  order_id: string;
  previous_status: string;
  new_status: string;
  technical_status?: string;
  action: 'updated' | 'skipped' | 'error';
  reason: string;
}

interface MercadoPagoStatus {
  status: string;
  status_detail: string;
  date_approved?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-secret",
};

const PREFIX = '[reconcile-mercadopago]';
const FUNCTION_VERSION = '2.0.0';

// ============================================================================
// LOGGER
// ============================================================================

function logInfo(message: string, data?: unknown): void {
  console.log(`${PREFIX} [v${FUNCTION_VERSION}] [INFO] ${message}`, data ? JSON.stringify(data) : '');
}

function logWarn(message: string, data?: unknown): void {
  console.warn(`${PREFIX} [v${FUNCTION_VERSION}] [WARN] ${message}`, data ? JSON.stringify(data) : '');
}

function logError(message: string, error?: unknown): void {
  console.error(`${PREFIX} [v${FUNCTION_VERSION}] [ERROR] ${message}`, error);
}

// ============================================================================
// VAULT CREDENTIALS
// ============================================================================

async function getVaultCredentials(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('get_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: 'mercadopago',
    });

    if (error || !data?.success || !data?.credentials?.access_token) {
      return null;
    }

    return data.credentials.access_token;
  } catch {
    return null;
  }
}

// ============================================================================
// MERCADOPAGO API
// ============================================================================

async function getMercadoPagoStatus(
  paymentId: string,
  accessToken: string
): Promise<MercadoPagoStatus | null> {
  try {
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      logError(`MercadoPago API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      status: data.status,
      status_detail: data.status_detail,
      date_approved: data.date_approved,
    };
  } catch (error) {
    logError('Erro ao consultar MercadoPago', error);
    return null;
  }
}

// ============================================================================
// TRIGGER WEBHOOKS
// ============================================================================

async function triggerWebhooks(orderId: string, eventType: string): Promise<void> {
  const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  if (!internalSecret || !supabaseUrl) return;

  try {
    await fetch(`${supabaseUrl}/functions/v1/trigger-webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({ order_id: orderId, event_type: eventType }),
    });
  } catch (error) {
    logWarn('Erro ao disparar webhooks', { orderId, error });
  }
}

// ============================================================================
// GRANT MEMBER ACCESS
// ============================================================================

async function callGrantMemberAccess(order: PendingOrder): Promise<void> {
  const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  if (!internalSecret || !supabaseUrl) return;

  try {
    await fetch(`${supabaseUrl}/functions/v1/grant-member-access`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({
        order_id: order.id,
        vendor_id: order.vendor_id,
        product_id: order.product_id,
        customer_email: order.customer_email,
        customer_name: order.customer_name,
      }),
    });
  } catch (error) {
    logWarn('Erro ao conceder acesso member area', { orderId: order.id, error });
  }
}

// ============================================================================
// RECONCILE SINGLE ORDER - MODELO HOTMART/KIWIFY
// ============================================================================

async function reconcileOrder(
  supabase: SupabaseClient,
  order: PendingOrder,
  accessToken: string
): Promise<ReconcileResult> {
  const orderId = order.id;

  // Check idempotency
  const { data: existingEvent } = await supabase
    .from('order_events')
    .select('id')
    .eq('order_id', orderId)
    .eq('type', 'purchase_approved')
    .single();

  if (existingEvent) {
    return {
      order_id: orderId,
      previous_status: order.status,
      new_status: order.status,
      action: 'skipped',
      reason: 'Já possui evento purchase_approved',
    };
  }

  // Query MercadoPago API
  const mpStatus = await getMercadoPagoStatus(order.gateway_payment_id, accessToken);
  if (!mpStatus) {
    return {
      order_id: orderId,
      previous_status: order.status,
      new_status: order.status,
      action: 'error',
      reason: 'Não foi possível consultar status no MercadoPago',
    };
  }

  // Process approved
  if (mpStatus.status === 'approved') {
    const paidAt = mpStatus.date_approved || new Date().toISOString();

    await supabase
      .from('orders')
      .update({
        status: 'paid',
        pix_status: 'approved',
        paid_at: paidAt,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await supabase.from('order_events').insert({
      order_id: orderId,
      vendor_id: order.vendor_id,
      type: 'purchase_approved',
      occurred_at: new Date().toISOString(),
      data: {
        source: 'reconcile-mercadopago',
        gateway_status: mpStatus.status,
        reconciled_at: new Date().toISOString(),
        model: 'hotmart_kiwify',
        version: FUNCTION_VERSION,
      },
    });

    await callGrantMemberAccess(order);
    await triggerWebhooks(orderId, 'purchase_approved');

    return {
      order_id: orderId,
      previous_status: order.status,
      new_status: 'paid',
      action: 'updated',
      reason: 'Pagamento confirmado via reconciliação',
    };
  }

  // Process refunded/chargeback - estes SIM mudam status
  if (['refunded', 'charged_back'].includes(mpStatus.status)) {
    const newStatus = mpStatus.status === 'charged_back' ? 'chargeback' : 'refunded';

    await supabase
      .from('orders')
      .update({
        status: newStatus,
        pix_status: mpStatus.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await supabase.from('order_events').insert({
      order_id: orderId,
      vendor_id: order.vendor_id,
      type: `purchase_${mpStatus.status}`,
      occurred_at: new Date().toISOString(),
      data: { 
        source: 'reconcile-mercadopago', 
        gateway_status: mpStatus.status,
        model: 'hotmart_kiwify',
        version: FUNCTION_VERSION,
      },
    });

    return {
      order_id: orderId,
      previous_status: order.status,
      new_status: newStatus,
      action: 'updated',
      reason: `Status atualizado para ${newStatus}`,
    };
  }

  // MODELO HOTMART/KIWIFY: rejected/cancelled = continua PENDING
  if (['rejected', 'cancelled'].includes(mpStatus.status)) {
    const technicalStatus = mpStatus.status === 'rejected' ? 'gateway_error' : 'gateway_cancelled';

    // NÃO muda o status principal - apenas atualiza technical_status
    await supabase
      .from('orders')
      .update({
        technical_status: technicalStatus,
        expired_at: new Date().toISOString(),
        pix_status: mpStatus.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await supabase.from('order_events').insert({
      order_id: orderId,
      vendor_id: order.vendor_id,
      type: `mercadopago_${mpStatus.status}`,
      occurred_at: new Date().toISOString(),
      data: { 
        source: 'reconcile-mercadopago', 
        gateway_status: mpStatus.status,
        technical_status: technicalStatus,
        model: 'hotmart_kiwify',
        note: 'Status mantido como pending (padrão de mercado)',
        version: FUNCTION_VERSION,
      },
    });

    logInfo(`[MODELO HOTMART] Order ${orderId}: mantendo status=${order.status}, technical_status=${technicalStatus}`);

    return {
      order_id: orderId,
      previous_status: order.status,
      new_status: order.status, // Mantém o mesmo status
      technical_status: technicalStatus,
      action: 'updated',
      reason: `Technical status atualizado para ${technicalStatus} (status público mantido como ${order.status})`,
    };
  }

  return {
    order_id: orderId,
    previous_status: order.status,
    new_status: order.status,
    action: 'skipped',
    reason: `Status ainda pendente: ${mpStatus.status}`,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as { orders: PendingOrder[] };

    if (!body.orders || !Array.isArray(body.orders)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing orders array' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    logInfo(`Processando ${body.orders.length} pedidos MercadoPago (Modelo Hotmart/Kiwify)`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const results: ReconcileResult[] = [];
    const credentialsCache: Record<string, string | null> = {};

    for (const order of body.orders) {
      // Rate limiting between orders
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get cached credentials or fetch new
      if (!(order.vendor_id in credentialsCache)) {
        credentialsCache[order.vendor_id] = await getVaultCredentials(supabase, order.vendor_id);
      }

      const accessToken = credentialsCache[order.vendor_id];
      if (!accessToken) {
        results.push({
          order_id: order.id,
          previous_status: order.status,
          new_status: order.status,
          action: 'error',
          reason: 'Credenciais MercadoPago não encontradas no Vault',
        });
        continue;
      }

      const result = await reconcileOrder(supabase, order, accessToken);
      results.push(result);
      logInfo(`Pedido ${order.id}: ${result.action} - ${result.reason}`);
    }

    const summary = {
      total: results.length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      errors: results.filter(r => r.action === 'error').length,
      model: 'hotmart_kiwify',
      version: FUNCTION_VERSION,
    };

    logInfo('Reconciliação MercadoPago concluída', summary);

    return new Response(
      JSON.stringify({ success: true, results, summary }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    logError('Handler error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
