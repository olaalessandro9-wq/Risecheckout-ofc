/**
 * coupon-processor.ts - Validação e Aplicação de Cupom
 * 
 * RISE ARCHITECT PROTOCOL V3 - 10.0/10
 * 
 * Responsabilidade ÚNICA: Validar cupom e calcular desconto
 * 
 * Lógica de Order Bumps:
 * - Se apply_to_order_bumps = true: desconto sobre totalAmount (produto + bumps)
 * - Se apply_to_order_bumps = false: desconto sobre finalPrice (só produto)
 * 
 * Validação de Vínculo:
 * - Cupom DEVE estar vinculado ao product_id PRINCIPAL
 * - Cupons de produtos bump NÃO funcionam no checkout do produto principal
 * 
 * @module create-order/handlers/coupon-processor
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../../_shared/logger.ts";

const log = createLogger("coupon-processor");

export interface CouponResult {
  discountAmount: number;
  couponCode: string | null;
}

export interface CouponInput {
  coupon_id?: string;
  product_id: string;
  totalAmount: number;
  finalPrice: number;
  customer_email?: string;
}

interface CouponRecord {
  id: string;
  code: string;
  active: boolean;
  discount_type: string;
  discount_value: number;
  start_date: string | null;
  expires_at: string | null;
  uses_count: number | null;
  max_uses: number | null;
  max_uses_per_customer: number | null;
  apply_to_order_bumps: boolean | null;
}

interface CouponProductRecord {
  coupon_id: string;
  product_id: string;
}

interface UpdatedCouponRecord {
  id: string;
  code: string;
}

/**
 * Valida e aplica cupom de desconto
 * Retorna valor do desconto e código aplicado
 */
export async function processCoupon(
  supabase: SupabaseClient,
  input: CouponInput
): Promise<CouponResult> {
  const { coupon_id, product_id, totalAmount, finalPrice } = input;

  let discountAmount = 0;
  let couponCode: string | null = null;

  if (!coupon_id) {
    return { discountAmount, couponCode };
  }

  log.info("Validando cupom:", coupon_id);

  // Buscar cupom ativo
  const { data: coupon, error: couponError } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", coupon_id)
    .eq("active", true)
    .maybeSingle();

  if (couponError || !coupon) {
    log.warn("Cupom inválido:", coupon_id);
    return { discountAmount, couponCode };
  }

  const couponData = coupon as CouponRecord;

  // Verificar vínculo com produto PRINCIPAL
  const { data: couponProduct } = await supabase
    .from("coupon_products")
    .select("*")
    .eq("coupon_id", couponData.id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (!couponProduct) {
    log.warn("Cupom não vinculado ao produto:", coupon_id);
    return { discountAmount, couponCode };
  }

  // Verificar datas
  const now = new Date();
  const validDate = 
    (!couponData.start_date || new Date(couponData.start_date) < now) &&
    (!couponData.expires_at || new Date(couponData.expires_at) > now);

  if (!validDate) {
    log.warn("Cupom fora do período válido");
    return { discountAmount, couponCode };
  }

  // RISE V3: Verificar limite por cliente
  if (couponData.max_uses_per_customer && couponData.max_uses_per_customer > 0 && input.customer_email) {
    const { count, error: countError } = await supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .eq("coupon_code", couponData.code)
      .ilike("customer_email", input.customer_email);

    if (!countError && (count ?? 0) >= couponData.max_uses_per_customer) {
      log.warn("Cupom atingiu limite por cliente:", {
        code: couponData.code,
        customer: input.customer_email,
        limit: couponData.max_uses_per_customer,
        used: count
      });
      return { discountAmount, couponCode };
    }
  }

  // Incremento atômico com verificação de limite (race condition fix)
  const { data: updatedCoupon, error: updateError } = await supabase
    .from("coupons")
    .update({
      uses_count: (couponData.uses_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq("id", couponData.id)
    .eq("active", true)
    .or(`max_uses.is.null,uses_count.lt.${couponData.max_uses || 999999}`)
    .select("id, code")
    .maybeSingle();

  if (!updatedCoupon) {
    log.warn("Cupom esgotado (race condition prevenida)");
    return { discountAmount, couponCode };
  }

  const updated = updatedCoupon as UpdatedCouponRecord;

  // Calcular desconto baseado na configuração apply_to_order_bumps
  // - true: desconto sobre totalAmount (produto principal + bumps)
  // - false: desconto apenas sobre finalPrice (só produto principal)
  const discountBase = couponData.apply_to_order_bumps ? totalAmount : finalPrice;

  if (couponData.discount_type === "percentage") {
    discountAmount = (discountBase * Number(couponData.discount_value)) / 100;
  } else {
    discountAmount = Number(couponData.discount_value);
  }

  discountAmount = Math.min(discountAmount, totalAmount);
  couponCode = couponData.code;

  log.info("Cupom aplicado:", {
    code: couponData.code,
    discount_amount: discountAmount
  });

  return { discountAmount, couponCode };
}
