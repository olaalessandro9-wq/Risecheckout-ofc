/**
 * coupon-processor.ts - Validação e Aplicação de Cupom
 * 
 * Responsabilidade ÚNICA: Validar cupom e calcular desconto
 */

export interface CouponResult {
  discountAmount: number;
  couponCode: string | null;
}

export interface CouponInput {
  coupon_id?: string;
  product_id: string;
  totalAmount: number;
  finalPrice: number;
}

/**
 * Valida e aplica cupom de desconto
 * Retorna valor do desconto e código aplicado
 */
export async function processCoupon(
  supabase: any,
  input: CouponInput
): Promise<CouponResult> {
  const { coupon_id, product_id, totalAmount, finalPrice } = input;

  let discountAmount = 0;
  let couponCode: string | null = null;

  if (!coupon_id) {
    return { discountAmount, couponCode };
  }

  console.log("[coupon-processor] Validando cupom:", coupon_id);

  // Buscar cupom ativo
  const { data: coupon, error: couponError } = await supabase
    .from("coupons")
    .select("*")
    .eq("id", coupon_id)
    .eq("active", true)
    .maybeSingle();

  if (couponError || !coupon) {
    console.warn("[coupon-processor] Cupom inválido:", coupon_id);
    return { discountAmount, couponCode };
  }

  // Verificar vínculo com produto
  const { data: couponProduct } = await supabase
    .from("coupon_products")
    .select("*")
    .eq("coupon_id", coupon.id)
    .eq("product_id", product_id)
    .maybeSingle();

  if (!couponProduct) {
    console.warn("[coupon-processor] Cupom não vinculado ao produto:", coupon_id);
    return { discountAmount, couponCode };
  }

  // Verificar datas
  const now = new Date();
  const validDate = 
    (!coupon.start_date || new Date(coupon.start_date) < now) &&
    (!coupon.expires_at || new Date(coupon.expires_at) > now);

  if (!validDate) {
    console.warn("[coupon-processor] Cupom fora do período válido");
    return { discountAmount, couponCode };
  }

  // Incremento atômico com verificação de limite (race condition fix)
  const { data: updatedCoupon, error: updateError } = await supabase
    .from("coupons")
    .update({
      uses_count: (coupon.uses_count || 0) + 1,
      updated_at: new Date().toISOString()
    })
    .eq("id", coupon.id)
    .eq("active", true)
    .or(`max_uses.is.null,uses_count.lt.${coupon.max_uses || 999999}`)
    .select("id, code")
    .maybeSingle();

  if (!updatedCoupon) {
    console.warn("[coupon-processor] Cupom esgotado (race condition prevenida)");
    return { discountAmount, couponCode };
  }

  // Calcular desconto
  const discountBase = coupon.apply_to_order_bumps ? totalAmount : finalPrice;

  if (coupon.discount_type === "percentage") {
    discountAmount = (discountBase * Number(coupon.discount_value)) / 100;
  } else {
    discountAmount = Number(coupon.discount_value);
  }

  discountAmount = Math.min(discountAmount, totalAmount);
  couponCode = coupon.code;

  console.log("[coupon-processor] Cupom aplicado:", {
    code: coupon.code,
    discount_amount: discountAmount
  });

  return { discountAmount, couponCode };
}
