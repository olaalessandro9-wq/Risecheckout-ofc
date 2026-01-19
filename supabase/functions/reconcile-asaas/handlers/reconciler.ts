/**
 * Reconcile Asaas - Core Reconciliation Logic
 * 
 * @see RISE Protocol V3 - Single Responsibility
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";
import type { 
  PendingOrder, 
  ReconcileResult, 
  AsaasCredentials, 
  AsaasStatusResult 
} from "../types.ts";

const log = createLogger("ReconcileAsaas");

// ============================================================================
// VAULT CREDENTIALS
// ============================================================================

export async function getVaultCredentials(
  supabase: SupabaseClient,
  vendorId: string
): Promise<AsaasCredentials | null> {
  try {
    const { data, error } = await supabase.rpc('get_gateway_credentials', {
      p_vendor_id: vendorId,
      p_gateway: 'asaas',
    });

    if (error || !data?.success || !data?.credentials?.access_token) {
      return null;
    }

    return {
      access_token: data.credentials.access_token,
      environment: data.credentials.environment || 'production',
    };
  } catch {
    return null;
  }
}

// ============================================================================
// ASAAS API
// ============================================================================

export async function getAsaasStatus(
  paymentId: string,
  apiKey: string,
  sandbox: boolean = false
): Promise<AsaasStatusResult | null> {
  try {
    const baseUrl = sandbox 
      ? 'https://sandbox.asaas.com/api/v3' 
      : 'https://api.asaas.com/v3';

    const response = await fetch(`${baseUrl}/payments/${paymentId}`, {
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      log.error(`Asaas API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    return {
      status: data.status,
      confirmedDate: data.confirmedDate,
    };
  } catch (error) {
    log.error('Erro ao consultar Asaas', error);
    return null;
  }
}

export function mapAsaasStatusToInternal(asaasStatus: string): string {
  if (['RECEIVED', 'CONFIRMED', 'RECEIVED_IN_CASH'].includes(asaasStatus)) return 'approved';
  if (['OVERDUE', 'REFUNDED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE'].includes(asaasStatus)) return 'rejected';
  return 'pending';
}

// ============================================================================
// TRIGGER WEBHOOKS
// ============================================================================

export async function triggerWebhooks(orderId: string, eventType: string): Promise<void> {
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
    log.warn('Erro ao disparar webhooks', { orderId, error });
  }
}

// ============================================================================
// GRANT MEMBER ACCESS
// ============================================================================

export async function callGrantMemberAccess(order: PendingOrder): Promise<void> {
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
    log.warn('Erro ao conceder acesso member area', { orderId: order.id, error });
  }
}

// ============================================================================
// RECONCILE SINGLE ORDER
// ============================================================================

export async function reconcileOrder(
  supabase: SupabaseClient,
  order: PendingOrder,
  credentials: AsaasCredentials
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

  // Query Asaas API
  const isSandbox = credentials.environment === 'sandbox';
  const asaasResult = await getAsaasStatus(order.gateway_payment_id, credentials.access_token, isSandbox);
  
  if (!asaasResult) {
    return {
      order_id: orderId,
      previous_status: order.status,
      new_status: order.status,
      action: 'error',
      reason: 'Não foi possível consultar status no Asaas',
    };
  }

  const internalStatus = mapAsaasStatusToInternal(asaasResult.status);

  // Process approved
  if (internalStatus === 'approved') {
    const paidAt = asaasResult.confirmedDate || new Date().toISOString();

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
        source: 'reconcile-asaas',
        gateway_status: asaasResult.status,
        reconciled_at: new Date().toISOString(),
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

  // Process rejected
  if (internalStatus === 'rejected') {
    const newStatus = asaasResult.status === 'REFUNDED' ? 'refunded' 
      : asaasResult.status.includes('CHARGEBACK') ? 'chargeback' 
      : 'rejected';

    await supabase
      .from('orders')
      .update({
        status: newStatus,
        pix_status: asaasResult.status.toLowerCase(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    await supabase.from('order_events').insert({
      order_id: orderId,
      vendor_id: order.vendor_id,
      type: `purchase_${newStatus}`,
      occurred_at: new Date().toISOString(),
      data: { source: 'reconcile-asaas', gateway_status: asaasResult.status },
    });

    return {
      order_id: orderId,
      previous_status: order.status,
      new_status: newStatus,
      action: 'updated',
      reason: `Status atualizado para ${newStatus}`,
    };
  }

  return {
    order_id: orderId,
    previous_status: order.status,
    new_status: order.status,
    action: 'skipped',
    reason: `Status ainda pendente: ${asaasResult.status}`,
  };
}
