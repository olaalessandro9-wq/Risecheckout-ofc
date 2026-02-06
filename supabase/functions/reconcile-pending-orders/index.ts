/**
 * ============================================================================
 * RECONCILE-PENDING-ORDERS EDGE FUNCTION (ORCHESTRATOR)
 * ============================================================================
 * 
 * @version 3.0.0 - RISE ARCHITECT PROTOCOL V3 - 10.0/10 (Refactored to Orchestrator)
 * 
 * Função orquestradora para reconciliação de pedidos pendentes.
 * Executa a cada 5 minutos via scheduler externo.
 * 
 * ============================================================================
 * RESPONSABILIDADE ÚNICA (SRP)
 * ============================================================================
 * 
 * 1. Valida autenticação (X-Internal-Secret)
 * 2. Busca pedidos pendentes no banco
 * 3. Agrupa pedidos por gateway
 * 4. Delega para funções especializadas:
 *    - reconcile-mercadopago
 *    - reconcile-asaas
 * 5. Agrega resultados e retorna
 * 
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { PUBLIC_CORS_HEADERS as CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";

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
}

interface ReconcileResult {
  order_id: string;
  previous_status: string;
  new_status: string;
  action: 'updated' | 'skipped' | 'error';
  reason: string;
}

interface GatewayResponse {
  success: boolean;
  results?: ReconcileResult[];
  summary?: { total: number; updated: number; skipped: number; errors: number };
  error?: string;
}

// ============================================================================
// CONSTANTS & LOGGER
// ============================================================================

const log = createLogger("ReconcilePendingOrders");
const FUNCTION_VERSION = "3.0";
const MAX_ORDERS_PER_RUN = 50;
const MIN_AGE_MINUTES = 3;
const MAX_AGE_HOURS = 24;

// ============================================================================
// GATEWAY DELEGATION
// ============================================================================

async function callGatewayReconciler(
  gateway: string,
  orders: PendingOrder[]
): Promise<GatewayResponse> {
  const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');

  if (!internalSecret || !supabaseUrl) {
    return { success: false, error: 'Missing environment variables' };
  }

  const functionName = `reconcile-${gateway}`;

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/${functionName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': internalSecret,
      },
      body: JSON.stringify({ orders }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `${functionName} returned ${response.status}: ${errorText}` };
    }

    return await response.json() as GatewayResponse;
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error) 
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
    log.info(`Versão ${FUNCTION_VERSION} (Orchestrator) iniciada`);

    // Validate internal authentication
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      log.error('Unauthorized: Invalid or missing X-Internal-Secret');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase
    const supabase = getSupabaseClient('payments');

    // Calculate time boundaries
    const minAgeDate = new Date();
    minAgeDate.setMinutes(minAgeDate.getMinutes() - MIN_AGE_MINUTES);

    const maxAgeDate = new Date();
    maxAgeDate.setHours(maxAgeDate.getHours() - MAX_AGE_HOURS);

    // Fetch pending orders
    const { data: pendingOrders, error: queryError } = await supabase
      .from('orders')
      .select('id, vendor_id, product_id, gateway, gateway_payment_id, pix_id, status, customer_email, customer_name')
      .eq('status', 'PENDING')
      .lt('created_at', minAgeDate.toISOString())
      .gt('created_at', maxAgeDate.toISOString())
      .order('created_at', { ascending: true })
      .limit(MAX_ORDERS_PER_RUN);

    if (queryError) {
      throw new Error(`Erro ao buscar pedidos: ${queryError.message}`);
    }

    const orders = (pendingOrders || []) as PendingOrder[];

    if (orders.length === 0) {
      log.info('Nenhum pedido pendente para reconciliar');
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

    log.info(`Encontrados ${orders.length} pedidos para reconciliar`);

    // Group orders by gateway
    const mercadopagoOrders = orders.filter(
      o => o.gateway?.toLowerCase() === 'mercadopago' && o.gateway_payment_id
    );
    const asaasOrders = orders.filter(
      o => o.gateway?.toLowerCase() === 'asaas' && o.gateway_payment_id
    );
    const unsupportedOrders = orders.filter(
      o => !['mercadopago', 'asaas'].includes(o.gateway?.toLowerCase() || '') || !o.gateway_payment_id
    );

    log.info('Pedidos agrupados por gateway', {
      mercadopago: mercadopagoOrders.length,
      asaas: asaasOrders.length,
      unsupported: unsupportedOrders.length,
    });

    // Delegate to specialized functions in parallel
    const [mpResponse, asaasResponse] = await Promise.all([
      mercadopagoOrders.length > 0 
        ? callGatewayReconciler('mercadopago', mercadopagoOrders) 
        : { success: true, results: [], summary: { total: 0, updated: 0, skipped: 0, errors: 0 } },
      asaasOrders.length > 0 
        ? callGatewayReconciler('asaas', asaasOrders) 
        : { success: true, results: [], summary: { total: 0, updated: 0, skipped: 0, errors: 0 } },
    ]);

    // Build results for unsupported gateways
    const unsupportedResults: ReconcileResult[] = unsupportedOrders.map(order => ({
      order_id: order.id,
      previous_status: order.status,
      new_status: order.status,
      action: 'skipped' as const,
      reason: `Gateway ${order.gateway || 'null'} não suportado ou sem payment_id`,
    }));

    // Aggregate results
    const allResults: ReconcileResult[] = [
      ...(mpResponse.results || []),
      ...(asaasResponse.results || []),
      ...unsupportedResults,
    ];

    const summary = {
      total: allResults.length,
      updated: allResults.filter(r => r.action === 'updated').length,
      skipped: allResults.filter(r => r.action === 'skipped').length,
      errors: allResults.filter(r => r.action === 'error').length,
      by_gateway: {
        mercadopago: mpResponse.summary || { total: 0, updated: 0, skipped: 0, errors: 0 },
        asaas: asaasResponse.summary || { total: 0, updated: 0, skipped: 0, errors: 0 },
        unsupported: { total: unsupportedResults.length, skipped: unsupportedResults.length },
      },
    };

    const durationMs = Date.now() - startTime;
    log.info(`Reconciliação concluída em ${durationMs}ms`, summary);

    return new Response(
      JSON.stringify({
        success: true,
        version: FUNCTION_VERSION,
        results: allResults,
        summary,
        duration_ms: durationMs,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    log.error('Handler error', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        duration_ms: durationMs,
      }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
