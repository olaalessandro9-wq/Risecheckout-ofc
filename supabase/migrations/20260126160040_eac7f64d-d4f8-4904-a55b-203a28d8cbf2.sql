-- RISE ARCHITECT PROTOCOL V3 - 10.0/10
-- Correção: Remover unicidade global de código de cupom
-- Adicionar validação por produto via trigger

-- 1. Remover constraint global incorreta
ALTER TABLE public.coupons DROP CONSTRAINT IF EXISTS coupons_code_key;

-- 2. Criar índice não-único para performance (busca por código)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);

-- 3. Função de validação de unicidade por produto
CREATE OR REPLACE FUNCTION public.validate_coupon_product_unique_code()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon_code TEXT;
  v_existing_count INTEGER;
BEGIN
  -- Buscar código do cupom sendo vinculado
  SELECT code INTO v_coupon_code FROM coupons WHERE id = NEW.coupon_id;
  
  -- Verificar se já existe outro cupom com mesmo código para este produto
  SELECT COUNT(*) INTO v_existing_count
  FROM coupons c
  INNER JOIN coupon_products cp ON c.id = cp.coupon_id
  WHERE cp.product_id = NEW.product_id
    AND UPPER(c.code) = UPPER(v_coupon_code)
    AND c.id != NEW.coupon_id;
  
  IF v_existing_count > 0 THEN
    RAISE EXCEPTION 'Código de cupom "%" já existe para este produto', v_coupon_code;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Criar trigger no coupon_products
DROP TRIGGER IF EXISTS trg_validate_coupon_product_unique_code ON public.coupon_products;
CREATE TRIGGER trg_validate_coupon_product_unique_code
  BEFORE INSERT ON public.coupon_products
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_coupon_product_unique_code();