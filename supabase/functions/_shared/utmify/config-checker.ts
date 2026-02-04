/**
 * ============================================================================
 * UTMify Config Checker
 * ============================================================================
 * 
 * @module _shared/utmify/config-checker
 * @version 1.1.0 - RISE Protocol V3
 * 
 * Verifica se um evento UTMify está habilitado para um vendor/produto.
 * Inclui função de diagnóstico para listar eventos habilitados.
 * ============================================================================
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../logger.ts";
import type { UTMifyEventType } from "./types.ts";

/**
 * Todos os eventos UTMify suportados
 */
const ALL_UTMIFY_EVENTS: UTMifyEventType[] = [
  "pix_generated",
  "purchase_approved",
  "purchase_refused",
  "refund",
  "chargeback",
];

const log = createLogger("UTMifyConfigChecker");

/**
 * Verifica se o evento está habilitado para o vendor/produto
 * 
 * RISE V3: Suporta múltiplos product IDs (ordem com bumps).
 * Se QUALQUER produto do pedido estiver na lista de produtos selecionados,
 * o evento será disparado.
 * 
 * @param supabase - Cliente Supabase
 * @param vendorId - ID do vendedor
 * @param eventType - Tipo do evento UTMify
 * @param productIds - Lista de IDs de produtos (opcional)
 * @returns true se o evento deve ser disparado
 */
export async function isEventEnabled(
  supabase: SupabaseClient,
  vendorId: string,
  eventType: UTMifyEventType,
  productIds?: string[]
): Promise<boolean> {
  try {
    const { data: integration } = await supabase
      .from("vendor_integrations")
      .select("active, config")
      .eq("vendor_id", vendorId)
      .eq("integration_type", "UTMIFY")
      .maybeSingle();

    if (!integration?.active) {
      return false;
    }

    const config = integration.config as Record<string, unknown> | null;
    const selectedEvents = config?.selected_events as string[] | undefined;
    const selectedProducts = config?.selected_products as string[] | undefined;

    // Se não há eventos selecionados, considera todos habilitados
    if (!selectedEvents || selectedEvents.length === 0) {
      return true;
    }

    // Verificar se o evento está na lista
    if (!selectedEvents.includes(eventType)) {
      return false;
    }

    // RISE V3: Se há filtro de produtos, verificar interseção
    // Pedidos com múltiplos itens (produto + bump) passam se QUALQUER item estiver selecionado
    if (selectedProducts && selectedProducts.length > 0 && productIds && productIds.length > 0) {
      const hasMatch = productIds.some(pid => selectedProducts.includes(pid));
      return hasMatch;
    }

    return true;
  } catch (error) {
    log.warn("Erro ao verificar configuração UTMify:", error);
    return false;
  }
}

/**
 * Lista todos os eventos habilitados para um vendor
 * 
 * Usado para diagnóstico e validação de configuração.
 * 
 * @param supabase - Cliente Supabase
 * @param vendorId - ID do vendedor
 * @returns Lista de eventos habilitados
 */
export async function listEnabledEvents(
  supabase: SupabaseClient,
  vendorId: string
): Promise<string[]> {
  try {
    const { data: integration } = await supabase
      .from("vendor_integrations")
      .select("active, config")
      .eq("vendor_id", vendorId)
      .eq("integration_type", "UTMIFY")
      .maybeSingle();

    if (!integration?.active) {
      return [];
    }

    const config = integration.config as Record<string, unknown> | null;
    const selectedEvents = config?.selected_events as string[] | undefined;

    // Se não há eventos selecionados, considera todos habilitados
    if (!selectedEvents || selectedEvents.length === 0) {
      return [...ALL_UTMIFY_EVENTS];
    }

    // Retorna apenas os eventos válidos
    return selectedEvents.filter(e => 
      ALL_UTMIFY_EVENTS.includes(e as UTMifyEventType)
    );
  } catch (error) {
    log.warn("Erro ao listar eventos UTMify:", error);
    return [];
  }
}
