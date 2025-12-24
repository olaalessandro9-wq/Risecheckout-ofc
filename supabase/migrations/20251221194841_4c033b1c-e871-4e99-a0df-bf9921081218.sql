-- ============================================================================
-- RPC: increment_affiliate_sales (ATÔMICO)
-- Incrementa contadores de vendas do afiliado de forma atômica
-- Evita race conditions em compras simultâneas
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_affiliate_sales(
  p_affiliate_id UUID,
  p_amount_cents INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliates
  SET 
    total_sales_count = COALESCE(total_sales_count, 0) + 1,
    total_sales_amount = COALESCE(total_sales_amount, 0) + p_amount_cents,
    updated_at = NOW()
  WHERE id = p_affiliate_id;
  
  -- Log para debugging
  RAISE NOTICE 'Affiliate % updated: +1 sale, +% cents', p_affiliate_id, p_amount_cents;
END;
$$;

-- Permitir que service_role (Edge Functions) execute
GRANT EXECUTE ON FUNCTION public.increment_affiliate_sales(UUID, INTEGER) TO service_role;

-- ============================================================================
-- NOTIFY POSTGREST
-- ============================================================================
NOTIFY pgrst, 'reload schema';