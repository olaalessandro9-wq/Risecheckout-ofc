/**
 * bump-processor.ts - Processamento de Order Bumps
 * 
 * Responsabilidade ÚNICA: Validar e calcular preços dos order bumps
 */

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

/**
 * Processa order bumps e retorna lista de itens com totais
 */
export async function processBumps(
  supabase: any,
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
    console.error("[bump-processor] Bumps inválidos:", {
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

  console.log("[bump-processor] Bumps validados:", bumps.map((b: any) => b.id));

  // Processar cada bump
  for (const bump of bumps) {
    try {
      if (!bump.product_id) {
        console.warn(`[bump-processor] Bump ${bump.id} sem produto vinculado`);
        continue;
      }

      let bumpPriceCents = 0;
      let bumpName = bump.custom_title || "Order Bump";

      // PRIORIDADE 1: Preço da OFFER vinculada (já em centavos)
      if (bump.offer_id) {
        const { data: bumpOffer } = await supabase
          .from("offers")
          .select("price, name")
          .eq("id", bump.offer_id)
          .maybeSingle();

        if (bumpOffer) {
          bumpPriceCents = Number(bumpOffer.price);
          if (!bump.custom_title) bumpName = bumpOffer.name;
          console.log(`[bump-processor] Bump via offer: ${bumpPriceCents} centavos`);
        }
      }

      // PRIORIDADE 2: Fallback para PRODUCT (BRL → centavos)
      if (bumpPriceCents === 0) {
        const { data: bumpProduct } = await supabase
          .from("products")
          .select("price, name")
          .eq("id", bump.product_id)
          .maybeSingle();

        if (bumpProduct) {
          bumpPriceCents = Math.round(Number(bumpProduct.price) * 100);
          if (!bump.custom_title) bumpName = bumpProduct.name;
          console.log(`[bump-processor] Bump via product: ${bumpPriceCents} centavos`);
        } else {
          console.warn(`[bump-processor] Produto ${bump.product_id} não existe`);
          continue;
        }
      }

      // PRIORIDADE 3: Override com discount_price (BRL → centavos)
      if (bump.discount_enabled && bump.discount_price) {
        bumpPriceCents = Math.round(Number(bump.discount_price) * 100);
        console.log(`[bump-processor] Bump com desconto: ${bumpPriceCents} centavos`);
      }

      totalAmount += bumpPriceCents;

      allOrderItems.push({
        product_id: bump.product_id,
        product_name: bumpName,
        amount_cents: bumpPriceCents,
        quantity: 1,
        is_bump: true
      });

    } catch (e) {
      console.error(`[bump-processor] Erro no bump ${bump.id}:`, e);
    }
  }

  return { allOrderItems, totalAmount };
}
