-- =====================================================
-- PERFORMANCE OPTIMIZATION: Checkout System
-- 
-- OPT-1: Índices compostos para products
-- OPT-3: RPC get_affiliate_checkout_info otimizado com JOIN
-- =====================================================

-- =====================================================
-- OPT-1: Índices para eliminar sequential scans em products
-- Nota: Sem CONCURRENTLY pois estamos em migration transacional
-- =====================================================

-- Índice para lookups de produtos ativos por ID
CREATE INDEX IF NOT EXISTS idx_products_active_lookup 
ON public.products(id) 
WHERE status = 'active';

-- Índice composto para queries de checkout (id + user_id)
CREATE INDEX IF NOT EXISTS idx_products_checkout_lookup
ON public.products(id, user_id)
WHERE status = 'active';

-- =====================================================
-- OPT-3: Reescrever RPC com LEFT JOIN (elimina subqueries)
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_affiliate_checkout_info(
  p_affiliate_code TEXT, 
  p_product_id UUID
)
RETURNS TABLE (
  pix_gateway TEXT,
  credit_card_gateway TEXT,
  mercadopago_public_key TEXT,
  stripe_public_key TEXT
) 
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.pix_gateway::TEXT,
    a.credit_card_gateway::TEXT,
    MAX(CASE WHEN vi.integration_type = 'MERCADOPAGO' THEN vi.config->>'public_key' END) as mercadopago_public_key,
    MAX(CASE WHEN vi.integration_type = 'STRIPE' THEN vi.config->>'public_key' END) as stripe_public_key
  FROM affiliates a
  LEFT JOIN vendor_integrations vi 
    ON vi.vendor_id = a.user_id 
    AND vi.integration_type IN ('MERCADOPAGO', 'STRIPE')
    AND vi.active = true
  WHERE a.affiliate_code = p_affiliate_code
    AND a.product_id = p_product_id
    AND a.status = 'active'
  GROUP BY a.pix_gateway, a.credit_card_gateway
  LIMIT 1;
$$;

-- Comentário de documentação
COMMENT ON FUNCTION public.get_affiliate_checkout_info(TEXT, UUID) IS 
'Busca informações de gateway do afiliado para checkout. OTIMIZADO em 2026-01-11: substituídas 2 subqueries correlacionadas por LEFT JOIN com agregação.';