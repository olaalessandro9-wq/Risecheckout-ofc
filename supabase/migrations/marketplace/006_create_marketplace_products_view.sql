-- ============================================
-- MIGRATION 006: View marketplace_products
-- Descrição: View otimizada para listar produtos no marketplace
-- Data: 20/12/2025
-- Autor: Manus AI
-- CORREÇÃO: Usa 'commission' ao invés de 'defaultRate' (feedback Lovable 3.0)
-- ============================================

-- Criar view do marketplace
CREATE OR REPLACE VIEW marketplace_products AS
SELECT 
  -- Dados do produto
  p.id,
  p.name,
  p.description,
  p.marketplace_description,
  p.price,
  p.image_url,
  p.marketplace_category,
  p.marketplace_tags,
  p.marketplace_views,
  p.marketplace_clicks,
  p.created_at,
  p.marketplace_enabled_at,
  
  -- Dados do produtor
  prof.name as producer_name,
  prof.id as producer_id,
  
  -- Dados de affiliate_settings JSONB (CORRIGIDO: 'commission' ao invés de 'defaultRate')
  (p.affiliate_settings->>'commission')::numeric as commission_percentage,
  (p.affiliate_settings->>'requireApproval')::boolean as requires_manual_approval,
  CASE 
    WHEN (p.affiliate_settings->>'requireApproval')::boolean = true 
    THEN 'manual' 
    ELSE 'automatic' 
  END as approval_mode,
  (p.affiliate_settings->>'cookieDuration')::integer as cookie_duration_days,
  
  -- Contagem de afiliados ativos
  (SELECT COUNT(*) 
   FROM affiliates af 
   WHERE af.product_id = p.id 
     AND af.status = 'approved') as total_affiliates,
  
  -- Flags de features do produto
  (p.upsell_settings IS NOT NULL) as has_upsell,
  (p.affiliate_settings->>'commissionOnOrderBump')::boolean as has_order_bump_commission,
  
  -- Taxa de conversão (clicks / views) - evita divisão por zero
  CASE 
    WHEN p.marketplace_views > 0 
    THEN ROUND((p.marketplace_clicks::numeric / p.marketplace_views::numeric) * 100, 2)
    ELSE 0 
  END as conversion_rate,
  
  -- Indicador de popularidade (baseado em afiliados + views)
  (
    (SELECT COUNT(*) FROM affiliates af WHERE af.product_id = p.id AND af.status = 'approved') * 10 +
    COALESCE(p.marketplace_views, 0)
  ) as popularity_score
  
FROM products p
LEFT JOIN profiles prof ON p.user_id = prof.id
WHERE p.show_in_marketplace = true
  AND p.status = 'active'
  AND (p.affiliate_settings->>'enabled')::boolean = true;

-- Comentário
COMMENT ON VIEW marketplace_products IS 'View otimizada para exibir produtos no marketplace público de afiliados';
