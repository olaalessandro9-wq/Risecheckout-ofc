-- Migration: Adicionar campo marketplace_rules à tabela products
-- Data: 2024-12-20
-- Descrição: Campo para produtores adicionarem regras e benefícios para afiliados

-- Adicionar coluna marketplace_rules
ALTER TABLE products
ADD COLUMN IF NOT EXISTS marketplace_rules TEXT;

-- Comentário
COMMENT ON COLUMN products.marketplace_rules IS 'Regras e benefícios para afiliados (texto longo, pode ser markdown)';

-- Atualizar view marketplace_products para incluir marketplace_rules
CREATE OR REPLACE VIEW marketplace_products AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.image_url,
  p.marketplace_description,
  p.marketplace_category,
  p.marketplace_tags,
  p.marketplace_rules,  -- NOVO
  p.user_id as producer_id,
  u.full_name as producer_name,
  u.email as producer_email,
  (p.affiliate_settings->>'commission')::numeric as commission,
  (p.affiliate_settings->>'requireApproval')::boolean as require_approval,
  (p.affiliate_settings->>'enabled')::boolean as affiliate_enabled,
  p.marketplace_enabled_at,
  p.marketplace_views,
  p.marketplace_clicks,
  p.created_at,
  p.updated_at
FROM products p
JOIN users u ON p.user_id = u.id
WHERE p.show_in_marketplace = true
  AND (p.affiliate_settings->>'enabled')::boolean = true;

-- Recriar grants
GRANT SELECT ON marketplace_products TO authenticated;
GRANT SELECT ON marketplace_products TO anon;
