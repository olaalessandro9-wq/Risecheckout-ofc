-- ============================================================================
-- RISE V3: RECRIAR VIEW MARKETPLACE_PRODUCTS COM CAMPOS COMPLETOS
-- ============================================================================

-- Dropar view existente
DROP VIEW IF EXISTS public.marketplace_products;

-- Recriar com SECURITY INVOKER (corrige lint warning)
CREATE VIEW public.marketplace_products 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.status,
  p.user_id,
  p.user_id as producer_id,
  p.marketplace_category as category,
  p.marketplace_category,
  p.show_in_marketplace as marketplace_enabled,
  p.marketplace_description,
  p.marketplace_tags,
  p.marketplace_views,
  p.marketplace_clicks,
  p.created_at,
  p.updated_at,
  -- Campos extraídos de affiliate_settings JSON
  COALESCE((p.affiliate_settings->>'commission')::numeric, 0) as commission_percentage,
  COALESCE((p.affiliate_settings->>'requireApproval')::boolean, false) as requires_manual_approval,
  COALESCE((p.affiliate_settings->>'commissionOnUpsells')::boolean, false) as has_order_bump_commission,
  COALESCE((p.affiliate_settings->>'enabled')::boolean, false) as affiliate_enabled,
  -- Campos do vendor
  u.name as vendor_name,
  u.name as producer_name,
  u.email as vendor_email
FROM public.products p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE p.show_in_marketplace = true 
  AND p.status = 'active';

COMMENT ON VIEW public.marketplace_products IS 'RISE V3: View de produtos marketplace usando users (SSOT) com SECURITY INVOKER';