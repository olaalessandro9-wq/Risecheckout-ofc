/**
 * ============================================================================
 * RECONCILE-ASAAS EDGE FUNCTION
 * ============================================================================
 * 
 * @version 2.0.0 - RISE Protocol V3 Compliant (Refactored)
 * 
 * Função especializada para reconciliar pedidos pendentes do Asaas.
 * Chamada pelo orquestrador `reconcile-pending-orders`.
 * 
 * @see handlers/reconciler.ts for core logic
 * @see types.ts for type definitions
 * ============================================================================
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { getSupabaseClient } from "../_shared/supabase-client.ts";
import { PUBLIC_CORS_HEADERS } from "../_shared/cors-v2.ts";
import { createLogger } from "../_shared/logger.ts";
import { getVaultCredentials, reconcileOrder } from "./handlers/reconciler.ts";
import type { 
  PendingOrder, 
  ReconcileResult, 
  AsaasCredentials,
  ReconcileRequestBody,
  ReconcileSummary 
} from "./types.ts";

const log = createLogger("ReconcileAsaas");

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: PUBLIC_CORS_HEADERS });
  }

  try {
    const internalSecret = req.headers.get('X-Internal-Secret');
    const expectedSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET');

    if (!internalSecret || internalSecret !== expectedSecret) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as ReconcileRequestBody;

    if (!body.orders || !Array.isArray(body.orders)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing orders array' }),
        { status: 400, headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' } }
      );
    }

    log.info(`Processando ${body.orders.length} pedidos Asaas`);

    const supabase = getSupabaseClient('payments');

    const results: ReconcileResult[] = [];
    const credentialsCache: Record<string, AsaasCredentials | null> = {};

    for (const order of body.orders) {
      // Rate limiting between orders
      if (results.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get cached credentials or fetch new
      if (!(order.vendor_id in credentialsCache)) {
        credentialsCache[order.vendor_id] = await getVaultCredentials(supabase, order.vendor_id);
      }

      const credentials = credentialsCache[order.vendor_id];
      if (!credentials) {
        results.push({
          order_id: order.id,
          previous_status: order.status,
          new_status: order.status,
          action: 'error',
          reason: 'Credenciais Asaas não encontradas no Vault',
        });
        continue;
      }

      const result = await reconcileOrder(supabase, order, credentials);
      results.push(result);
      log.info(`Pedido ${order.id}: ${result.action} - ${result.reason}`);
    }

    const summary: ReconcileSummary = {
      total: results.length,
      updated: results.filter(r => r.action === 'updated').length,
      skipped: results.filter(r => r.action === 'skipped').length,
      errors: results.filter(r => r.action === 'error').length,
    };

    log.info('Reconciliação Asaas concluída', summary);

    return new Response(
      JSON.stringify({ success: true, results, summary }),
      { headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    log.error('Handler error', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { status: 500, headers: { ...PUBLIC_CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
