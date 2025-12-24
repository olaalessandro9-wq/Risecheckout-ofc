-- ============================================================================
-- CORREÇÃO: View marketplace_products com campos corretos de affiliate_settings
-- ============================================================================

-- Recriar a view com os nomes CORRETOS dos campos do JSON affiliate_settings
CREATE OR REPLACE VIEW public.marketplace_products WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.created_at,
  p.marketplace_category,
  p.marketplace_description,
  p.marketplace_tags,
  p.marketplace_rules,
  p.marketplace_views,
  p.marketplace_clicks,
  p.marketplace_enabled_at,
  p.user_id AS producer_id,
  pr.name AS producer_name,
  
  -- CORREÇÕES: Usar nomes corretos do JSON affiliate_settings
  -- defaultRate (não commission_percentage)
  COALESCE((p.affiliate_settings->>'defaultRate')::integer, 0) AS commission_percentage,
  -- cookieDuration (não cookie_duration_days)  
  COALESCE((p.affiliate_settings->>'cookieDuration')::integer, 30) AS cookie_duration_days,
  -- attributionModel (não approval_mode)
  COALESCE(p.affiliate_settings->>'attributionModel', 'last_click') AS approval_mode,
  -- requireApproval (não requires_manual_approval)
  COALESCE((p.affiliate_settings->>'requireApproval')::boolean, false) AS requires_manual_approval,
  -- commissionOnUpsell (não has_upsell)
  COALESCE((p.affiliate_settings->>'commissionOnUpsell')::boolean, false) AS has_upsell,
  -- commissionOnOrderBump (não has_order_bump_commission)
  COALESCE((p.affiliate_settings->>'commissionOnOrderBump')::boolean, false) AS has_order_bump_commission,
  
  -- Contagem de afiliados ativos
  (SELECT COUNT(*) FROM public.affiliates a 
   WHERE a.product_id = p.id AND a.status = 'active')::integer AS total_affiliates,
  
  -- Taxa de conversão (clicks/views)
  CASE 
    WHEN COALESCE(p.marketplace_views, 0) > 0 
    THEN ROUND(COALESCE(p.marketplace_clicks, 0)::numeric / p.marketplace_views::numeric * 100, 2)
    ELSE 0
  END AS conversion_rate,
  
  -- Score de popularidade
  COALESCE(p.marketplace_views, 0) + COALESCE(p.marketplace_clicks, 0) AS popularity_score

FROM public.products p
LEFT JOIN public.profiles pr ON p.user_id = pr.id
WHERE p.show_in_marketplace = true
  AND (p.affiliate_settings->>'enabled')::boolean = true;

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';