-- ============================================
-- MIGRATION: Comissão Dinâmica do Afiliado
-- ============================================
-- Reseta commission_rate para NULL onde ela é igual ao defaultRate do produto
-- Isso indica que a comissão não foi customizada pelo produtor
-- e deve herdar dinamicamente do produto

UPDATE affiliates a
SET commission_rate = NULL
FROM products p
WHERE a.product_id = p.id
  AND a.commission_rate IS NOT NULL
  AND a.commission_rate = COALESCE(
    (p.affiliate_settings->>'defaultRate')::INTEGER,
    50
  );

-- Comentário explicativo para futura referência
COMMENT ON COLUMN affiliates.commission_rate IS 
  'Comissão customizada do afiliado. NULL = herda dinamicamente de products.affiliate_settings.defaultRate';