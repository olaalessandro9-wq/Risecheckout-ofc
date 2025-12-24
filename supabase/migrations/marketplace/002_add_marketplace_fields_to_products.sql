-- ============================================
-- MIGRATION 002: Adicionar campos marketplace à tabela products
-- Descrição: Campos para controlar exibição no marketplace público
-- Data: 20/12/2025
-- Autor: Manus AI
-- ============================================

-- Adicionar colunas para marketplace
ALTER TABLE products 
  ADD COLUMN IF NOT EXISTS show_in_marketplace BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS marketplace_description TEXT,
  ADD COLUMN IF NOT EXISTS marketplace_category VARCHAR(100),
  ADD COLUMN IF NOT EXISTS marketplace_tags TEXT[],
  ADD COLUMN IF NOT EXISTS marketplace_enabled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketplace_views INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS marketplace_clicks INTEGER DEFAULT 0;

-- Índices para performance
CREATE INDEX idx_products_marketplace ON products(show_in_marketplace) 
WHERE show_in_marketplace = true;

CREATE INDEX idx_products_marketplace_category ON products(marketplace_category) 
WHERE show_in_marketplace = true AND marketplace_category IS NOT NULL;

CREATE INDEX idx_products_marketplace_views ON products(marketplace_views DESC) 
WHERE show_in_marketplace = true;

CREATE INDEX idx_products_marketplace_clicks ON products(marketplace_clicks DESC) 
WHERE show_in_marketplace = true;

-- Comentários
COMMENT ON COLUMN products.show_in_marketplace IS 'Se true, produto aparece no marketplace público';
COMMENT ON COLUMN products.marketplace_description IS 'Descrição específica para o marketplace (pode ser diferente da description)';
COMMENT ON COLUMN products.marketplace_category IS 'Categoria no marketplace (digital, courses, ebooks, etc)';
COMMENT ON COLUMN products.marketplace_tags IS 'Tags para filtros e busca no marketplace';
COMMENT ON COLUMN products.marketplace_enabled_at IS 'Timestamp de quando foi habilitado no marketplace';
COMMENT ON COLUMN products.marketplace_views IS 'Contador de visualizações no marketplace';
COMMENT ON COLUMN products.marketplace_clicks IS 'Contador de cliques no botão de afiliação';
