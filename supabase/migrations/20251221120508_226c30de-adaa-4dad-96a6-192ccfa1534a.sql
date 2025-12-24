-- Corrigir view marketplace_products para usar 'defaultRate' em vez de 'commission'
CREATE OR REPLACE VIEW marketplace_products AS
SELECT p.id,
    p.name,
    p.description,
    p.marketplace_description,
    p.price,
    p.image_url,
    p.marketplace_category,
    p.marketplace_tags,
    p.marketplace_rules,
    p.marketplace_views,
    p.marketplace_clicks,
    p.created_at,
    p.marketplace_enabled_at,
    prof.name AS producer_name,
    prof.id AS producer_id,
    -- CORRIGIDO: usar 'defaultRate' em vez de 'commission'
    COALESCE((p.affiliate_settings ->> 'defaultRate')::numeric, 0) AS commission_percentage,
    (p.affiliate_settings ->> 'requireApproval'::text)::boolean AS requires_manual_approval,
    CASE
        WHEN ((p.affiliate_settings ->> 'requireApproval'::text)::boolean) = true THEN 'manual'::text
        ELSE 'automatic'::text
    END AS approval_mode,
    COALESCE((p.affiliate_settings ->> 'cookieDuration')::integer, 30) AS cookie_duration_days,
    ( SELECT count(*) AS count
           FROM affiliates af
          WHERE af.product_id = p.id AND af.status = 'approved'::text) AS total_affiliates,
    p.upsell_settings IS NOT NULL AS has_upsell,
    (p.affiliate_settings ->> 'commissionOnOrderBump'::text)::boolean AS has_order_bump_commission,
    CASE
        WHEN p.marketplace_views > 0 THEN round(p.marketplace_clicks::numeric / p.marketplace_views::numeric * 100::numeric, 2)
        ELSE 0::numeric
    END AS conversion_rate,
    (( SELECT count(*) AS count
           FROM affiliates af
          WHERE af.product_id = p.id AND af.status = 'approved'::text)) * 10 + COALESCE(p.marketplace_views, 0) AS popularity_score
FROM products p
LEFT JOIN profiles prof ON p.user_id = prof.id
WHERE p.show_in_marketplace = true 
  AND p.status = 'active'::text 
  AND ((p.affiliate_settings ->> 'enabled'::text)::boolean) = true;