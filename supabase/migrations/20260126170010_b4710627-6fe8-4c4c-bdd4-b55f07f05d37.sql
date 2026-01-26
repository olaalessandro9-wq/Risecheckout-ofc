-- RISE ARCHITECT PROTOCOL V3 - 10.0/10
-- Migration: Renomear discount_price para original_price
-- 
-- SEMÂNTICA CORRETA:
-- - original_price: Preço de MARKETING (riscado) - apenas visual
-- - O preço REAL é sempre da oferta/produto vinculado
-- - original_price NUNCA deve ser usado para cálculo de totais

-- Renomear coluna discount_price para original_price
ALTER TABLE order_bumps RENAME COLUMN discount_price TO original_price;

-- Atualizar comentário da coluna para documentar semântica correta
COMMENT ON COLUMN order_bumps.original_price IS 
  'Preço de MARKETING (riscado). O preço REAL é da oferta/produto vinculado. NUNCA usar para cálculo de totais.';