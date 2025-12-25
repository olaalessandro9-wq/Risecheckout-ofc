-- =====================================================
-- NORMALIZAÇÃO: Popular commission_rate nulos
-- Preenche commission_rate com defaultRate do produto
-- =====================================================

-- Atualizar affiliates com commission_rate nulo usando o defaultRate do produto
UPDATE public.affiliates a
SET commission_rate = COALESCE(
  (p.affiliate_settings->>'defaultRate')::numeric,
  10  -- fallback padrão se não houver defaultRate
)
FROM public.products p
WHERE a.product_id = p.id
  AND a.commission_rate IS NULL;

-- Adicionar constraint para prevenir futuros nulos
ALTER TABLE public.affiliates
ALTER COLUMN commission_rate SET DEFAULT 10;

-- Criar índice para otimizar paginação do marketplace
CREATE INDEX IF NOT EXISTS idx_products_marketplace_listing 
ON public.products (marketplace_enabled_at DESC, show_in_marketplace) 
WHERE show_in_marketplace = true;