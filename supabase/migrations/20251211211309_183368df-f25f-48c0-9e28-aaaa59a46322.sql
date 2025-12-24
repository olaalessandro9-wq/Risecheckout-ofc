-- ============================================================================
-- SECURITY FIX: Comprehensive RLS Policies & Coupon Validation RPC
-- ============================================================================

-- ============================================================================
-- PHASE 1: DROP PROBLEMATIC RLS POLICIES
-- ============================================================================

-- 1.1 Remove policy that exposes ALL active coupons publicly
DROP POLICY IF EXISTS "Allow anonymous to read active coupons" ON coupons;

-- 1.2 Remove policy that exposes coupon_products publicly  
DROP POLICY IF EXISTS "Allow anonymous to read coupon_products" ON coupon_products;

-- 1.3 Remove overly permissive offers policy (keep only the ones that check payment_links)
DROP POLICY IF EXISTS "public_read_offers_for_checkout" ON offers;

-- 1.4 Remove policy that exposes ALL active order_bumps publicly
DROP POLICY IF EXISTS "Anyone can view active order_bumps" ON order_bumps;

-- ============================================================================
-- PHASE 2: CREATE RESTRICTIVE POLICIES
-- ============================================================================

-- 2.1 Order bumps: Only visible if checkout has active payment link
CREATE POLICY "Public view order_bumps via active checkout link" 
ON order_bumps FOR SELECT 
USING (
  active = true 
  AND checkout_id IN (
    SELECT c.id FROM checkouts c
    JOIN checkout_links cl ON cl.checkout_id = c.id
    JOIN payment_links pl ON pl.id = cl.link_id
    WHERE pl.status = 'active' AND c.status = 'active'
  )
);

-- ============================================================================
-- PHASE 3: CREATE SECURE RPC FOR COUPON VALIDATION
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_code TEXT,
  p_product_id UUID
) RETURNS JSONB
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon RECORD;
  v_coupon_product RECORD;
BEGIN
  -- 1. Buscar cupom ativo pelo código (case insensitive)
  SELECT * INTO v_coupon
  FROM coupons
  WHERE code = UPPER(TRIM(p_code))
    AND active = true;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Cupom inválido ou não encontrado');
  END IF;
  
  -- 2. Verificar se cupom está vinculado ao produto
  SELECT * INTO v_coupon_product
  FROM coupon_products
  WHERE coupon_id = v_coupon.id
    AND product_id = p_product_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este cupom não é válido para este produto');
  END IF;
  
  -- 3. Verificar data de início
  IF v_coupon.start_date IS NOT NULL AND NOW() < v_coupon.start_date THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este cupom ainda não está ativo');
  END IF;
  
  -- 4. Verificar data de expiração
  IF v_coupon.expires_at IS NOT NULL AND NOW() > v_coupon.expires_at THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Este cupom expirou');
  END IF;
  
  -- 5. Verificar limite de usos
  IF v_coupon.max_uses IS NOT NULL AND v_coupon.max_uses > 0 THEN
    IF COALESCE(v_coupon.uses_count, 0) >= v_coupon.max_uses THEN
      RETURN jsonb_build_object('valid', false, 'error', 'Este cupom atingiu o limite de usos');
    END IF;
  END IF;
  
  -- 6. Cupom válido! Retornar dados necessários
  RETURN jsonb_build_object(
    'valid', true,
    'id', v_coupon.id,
    'code', v_coupon.code,
    'name', COALESCE(v_coupon.name, v_coupon.code),
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'apply_to_order_bumps', COALESCE(v_coupon.apply_to_order_bumps, false)
  );
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_coupon(TEXT, UUID) TO authenticated;

-- ============================================================================
-- VERIFICATION COMMENTS
-- ============================================================================
COMMENT ON FUNCTION public.validate_coupon IS 'Secure server-side coupon validation. Prevents enumeration of coupons by requiring product_id match.';