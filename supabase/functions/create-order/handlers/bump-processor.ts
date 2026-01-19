/**
 * bump-processor.ts - Processamento de Order Bumps
 * 
 * Responsabilidade ÚNICA: Validar e calcular preços dos order bumps
 * 
 * RISE Protocol V2 Compliant - Zero `any`
 * Version: 2.0.0
 * 
 * OTIMIZADO em 2026-01-11:
 * - Eliminado N+1 query pattern (antes: N queries por bump)
 * - Agora usa batch queries com Maps para O(1) lookup
 * - Redução estimada: -50-150ms por transação com bumps
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("bump-processor");

export interface OrderItem {
  product_id: string;
  product_name: string;
  amount_cents: number;
  quantity: number;
  is_bump: boolean;
}

export interface BumpProcessingResult {
  allOrderItems: OrderItem[];
  totalAmount: number;
}

export interface BumpProcessingInput {
  product_id: string;
  product_name: string;
  finalPrice: number;
  order_bump_ids?: string[];
  checkout_id?: string;
}

interface OfferData {
  id: string;
  price: number;
  name: string;
}

interface ProductData {
  id: string;
  price: number;
  name: string;
}

interface BumpData {
  id: string;
  product_id: string;
  offer_id: string | null;
  custom_title: string | null;
  discount_enabled: boolean | null;
  discount_price: number | null;
}

/**
 * Processa order bumps e retorna lista de itens com totais
 * 
 * OTIMIZAÇÃO: Usa batch queries + Maps ao invés de queries individuais no loop
 */
export async function processBumps(
  supabase: SupabaseClient,
  input: BumpProcessingInput,
  corsHeaders: Record<string, string>
): Promise<BumpProcessingResult | Response> {
  const { product_id, product_name, finalPrice, order_bump_ids, checkout_id } = input;

  let totalAmount = finalPrice;
  const allOrderItems: OrderItem[] = [];

  // Adicionar produto principal
  allOrderItems.push({
    product_id,
    product_name,
    amount_cents: Math.round(finalPrice),
    quantity: 1,
    is_bump: false
  });

  // Sem bumps? Retornar apenas produto principal
  if (!order_bump_ids || !Array.isArray(order_bump_ids) || order_bump_ids.length === 0) {
    return { allOrderItems, totalAmount };
  }

  // Validar bumps (ownership + status)
  const { data: bumps, error: bumpsError } = await supabase
    .from("order_bumps")
    .select("id, product_id, active, custom_title, discount_enabled, discount_price, offer_id")
    .in("id", order_bump_ids)
    .eq("checkout_id", checkout_id)
    .eq("active", true);

  if (bumpsError || !bumps || bumps.length !== order_bump_ids.length) {
    log.error("Bumps inválidos:", {
      requested: order_bump_ids.length,
      found: bumps?.length || 0
    });

    return new Response(
      JSON.stringify({
        error: "Invalid order bumps",
        details: "One or more selected order bumps are not available"
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  log.info("Bumps validados:", bumps.map((b: BumpData) => b.id));

  // =====================================================
  // OTIMIZAÇÃO: Batch queries para eliminar N+1
  // =====================================================
  
  // Coletar IDs únicos para batch queries
  const offerIds = bumps
    .map((b: BumpData) => b.offer_id)
    .filter((id: string | null): id is string => id !== null);
  
  const productIds = bumps
    .map((b: BumpData) => b.product_id)
    .filter((id: string | null): id is string => id !== null);

  // Batch queries em paralelo (ao invés de N queries no loop)
  const [offersResult, productsResult] = await Promise.all([
    offerIds.length > 0
      ? supabase
          .from("offers")
          .select("id, price, name")
          .in("id", offerIds)
      : Promise.resolve({ data: [] as OfferData[], error: null }),
    
    productIds.length > 0
      ? supabase
          .from("products")
          .select("id, price, name")
          .in("id", productIds)
      : Promise.resolve({ data: [] as ProductData[], error: null })
  ]);

  // Criar Maps para O(1) lookup (ao invés de queries)
  const offersMap = new Map<string, OfferData>(
    (offersResult.data || []).map((o: OfferData) => [o.id, o])
  );
  
  const productsMap = new Map<string, ProductData>(
    (productsResult.data || []).map((p: ProductData) => [p.id, p])
  );

  log.info("Batch query results:", {
    offers: offersMap.size,
    products: productsMap.size
  });

  // =====================================================
  // Processar cada bump usando Maps (sem queries adicionais)
  // =====================================================
  for (const bump of bumps as BumpData[]) {
    try {
      if (!bump.product_id) {
        log.warn(`Bump ${bump.id} sem produto vinculado`);
        continue;
      }

      let bumpPriceCents = 0;
      let bumpName = bump.custom_title || "Order Bump";

      // PRIORIDADE 1: Preço da OFFER vinculada (já em centavos)
      if (bump.offer_id) {
        const bumpOffer = offersMap.get(bump.offer_id);
        
        if (bumpOffer) {
          bumpPriceCents = Number(bumpOffer.price);
          if (!bump.custom_title) bumpName = bumpOffer.name;
          log.info(`Bump via offer: ${bumpPriceCents} centavos`);
        }
      }

      // PRIORIDADE 2: Fallback para PRODUCT (BRL → centavos)
      if (bumpPriceCents === 0) {
        const bumpProduct = productsMap.get(bump.product_id);

        if (bumpProduct) {
          bumpPriceCents = Math.round(Number(bumpProduct.price) * 100);
          if (!bump.custom_title) bumpName = bumpProduct.name;
          log.info(`Bump via product: ${bumpPriceCents} centavos`);
        } else {
          log.warn(`Produto ${bump.product_id} não encontrado no batch`);
          continue;
        }
      }

      // PRIORIDADE 3: Override com discount_price (BRL → centavos)
      if (bump.discount_enabled && bump.discount_price) {
        bumpPriceCents = Math.round(Number(bump.discount_price) * 100);
        log.info(`Bump com desconto: ${bumpPriceCents} centavos`);
      }

      totalAmount += bumpPriceCents;

      allOrderItems.push({
        product_id: bump.product_id,
        product_name: bumpName,
        amount_cents: bumpPriceCents,
        quantity: 1,
        is_bump: true
      });

    } catch (e: unknown) {
      log.error(`Erro no bump ${bump.id}:`, e);
    }
  }

  return { allOrderItems, totalAmount };
}
