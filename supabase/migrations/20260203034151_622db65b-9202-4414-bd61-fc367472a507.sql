-- ============================================================================
-- RISE V3: RECRIAR VIEW MARKETPLACE_PRODUCTS APONTANDO PARA USERS
-- ============================================================================

CREATE OR REPLACE VIEW public.marketplace_products AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.image_url,
  p.status,
  p.user_id,
  p.marketplace_category as category,
  p.show_in_marketplace as marketplace_enabled,
  p.marketplace_description,
  p.marketplace_tags,
  p.marketplace_views,
  p.marketplace_clicks,
  p.created_at,
  p.updated_at,
  u.name as vendor_name,
  u.email as vendor_email
FROM public.products p
LEFT JOIN public.users u ON p.user_id = u.id
WHERE p.show_in_marketplace = true 
  AND p.status = 'active';

COMMENT ON VIEW public.marketplace_products IS 'RISE V3: View de produtos marketplace usando users (SSOT)';