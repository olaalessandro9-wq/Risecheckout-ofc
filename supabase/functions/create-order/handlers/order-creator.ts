/**
 * order-creator.ts - Criação e Persistência do Pedido
 * 
 * @version 2.0.0 - RISE Protocol V2 Compliant - Zero `any`
 * 
 * Responsabilidade ÚNICA: Criar pedido no banco de dados
 * 
 * SECURITY UPDATE:
 * - CPF e telefone são criptografados com AES-256-GCM antes de salvar (LGPD)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../../_shared/rate-limiting/index.ts";
import { encryptValue } from "../../_shared/encryption.ts";
import { createLogger } from "../../_shared/logger.ts";
import type { OrderItem } from "./bump-processor.ts";

const log = createLogger("order-creator");

export interface OrderCreationResult {
  order_id: string;
  access_token: string;
  duplicate?: boolean;
}

export interface OrderCreationInput {
  // Dados do cliente
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  customer_cpf?: string;
  
  // Dados do produto
  product_id: string;
  product_name: string;
  vendor_id: string;
  
  // IDs validados
  validatedOfferId: string | null;
  validatedCheckoutId: string | null;
  
  // Valores
  amountInCents: number;
  discountAmount: number;
  
  // Cupom
  coupon_id?: string;
  couponCode: string | null;
  
  // Afiliado/Split
  affiliateId: string | null;
  commissionCents: number;
  platformFeeCents: number;
  
  // Gateway
  gateway: string;
  payment_method: string;
  
  // Itens
  allOrderItems: OrderItem[];
  
  // Rate limit
  identifier: string;
}

interface ExistingOrder {
  id: string;
  status: string;
  created_at: string;
}

interface CreatedOrder {
  id: string;
}

interface AffiliateStats {
  total_sales_count: number | null;
  total_sales_amount: number | null;
}

/**
 * Cria pedido no banco com verificação de idempotência
 */
export async function createOrder(
  supabase: SupabaseClient,
  input: OrderCreationInput,
  corsHeaders: Record<string, string>
): Promise<OrderCreationResult | Response> {
  const {
    customer_name,
    customer_email,
    customer_phone,
    customer_cpf,
    product_id,
    product_name,
    vendor_id,
    validatedOfferId,
    validatedCheckoutId,
    amountInCents,
    discountAmount,
    coupon_id,
    couponCode,
    affiliateId,
    commissionCents,
    platformFeeCents,
    gateway,
    payment_method,
    allOrderItems,
    identifier
  } = input;

  // Verificar idempotência (pedidos duplicados)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
  
  const { data: existingOrders } = await supabase
    .from("orders")
    .select("id, status, created_at")
    .eq("customer_email", customer_email)
    .eq("offer_id", validatedOfferId || product_id)
    .eq("amount_cents", amountInCents)
    .gte("created_at", fiveMinutesAgo)
    .limit(1);

  if (existingOrders && existingOrders.length > 0) {
    const existing = existingOrders[0] as ExistingOrder;
    log.info(`Pedido duplicado: ${existing.id}`);

    return new Response(
      JSON.stringify({
        success: true,
        order_id: existing.id,
        message: "Pedido já existe",
        duplicate: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }

  // Gerar access token
  const accessToken = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");

  // SECURITY: Criptografar dados sensíveis (LGPD)
  let encryptedPhone: string | null = null;
  let encryptedCpf: string | null = null;
  
  try {
    encryptedPhone = await encryptValue(customer_phone);
    encryptedCpf = await encryptValue(customer_cpf);
    log.info("✅ CPF/telefone criptografados com AES-256-GCM");
  } catch (encryptError) {
    log.error("❌ Falha na criptografia:", encryptError);
    // SECURITY: Não prosseguir sem criptografia
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: "Erro ao processar dados do cliente. Tente novamente." 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Inserir pedido com dados criptografados
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      checkout_id: validatedCheckoutId,
      product_id,
      offer_id: validatedOfferId,
      amount_cents: amountInCents,
      status: "pending",
      customer_name,
      customer_email,
      customer_phone: encryptedPhone,      // ✅ Criptografado
      customer_document: encryptedCpf,     // ✅ Criptografado
      payment_method: payment_method || "pix",
      gateway: gateway || "pushinpay",
      product_name,
      vendor_id,
      coupon_id: coupon_id || null,
      coupon_code: couponCode,
      discount_amount_cents: Math.round(discountAmount),
      access_token: accessToken,
      affiliate_id: affiliateId,
      commission_cents: commissionCents,
      platform_fee_cents: platformFeeCents
    })
    .select()
    .single();

  if (orderError) {
    log.error("Erro ao criar order:", orderError);
    throw orderError;
  }

  const createdOrder = order as CreatedOrder;
  log.info(`Pedido criado: ${createdOrder.id}`);

  // Inserir itens
  const itemsToInsert = allOrderItems.map(item => ({
    ...item,
    order_id: createdOrder.id
  }));

  await supabase.from("order_items").insert(itemsToInsert);
  log.info(`${itemsToInsert.length} itens inseridos`);

  // Atualizar contador de vendas do afiliado
  if (affiliateId) {
    await updateAffiliateStats(supabase, affiliateId, amountInCents);
  }

  return {
    order_id: createdOrder.id,
    access_token: accessToken
  };
}

/**
 * Atualiza contadores de vendas do afiliado (atômico)
 */
async function updateAffiliateStats(
  supabase: SupabaseClient,
  affiliateId: string,
  amountInCents: number
): Promise<void> {
  log.info(`Atualizando contadores: ${affiliateId}`);

  try {
    // Tentar RPC atômico primeiro
    const { error: rpcError } = await supabase.rpc("increment_affiliate_sales", {
      p_affiliate_id: affiliateId,
      p_amount_cents: amountInCents
    });

    if (rpcError) {
      // Fallback: UPDATE síncrono
      log.info("RPC indisponível, usando UPDATE");

      const { data: current } = await supabase
        .from("affiliates")
        .select("total_sales_count, total_sales_amount")
        .eq("id", affiliateId)
        .single();

      if (current) {
        const stats = current as AffiliateStats;
        const { error: updateError } = await supabase
          .from("affiliates")
          .update({
            total_sales_count: (stats.total_sales_count || 0) + 1,
            total_sales_amount: (stats.total_sales_amount || 0) + amountInCents,
            updated_at: new Date().toISOString()
          })
          .eq("id", affiliateId);

        if (updateError) {
          log.error("Erro ao atualizar afiliado:", updateError);
        } else {
          log.info("Contadores atualizados via UPDATE");
        }
      }
    } else {
      log.info("Contadores atualizados via RPC");
    }
  } catch (err: unknown) {
    const errMessage = err instanceof Error ? err.message : String(err);
    log.error("Erro inesperado:", errMessage);
  }
}
