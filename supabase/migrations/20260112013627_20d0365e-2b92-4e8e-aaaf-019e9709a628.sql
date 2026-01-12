-- Phase 6: Migration - Link all migrated pixels to all products of each vendor
-- Note: Previous inserts succeeded, only the JOIN failed

INSERT INTO public.product_pixels (product_id, pixel_id, fire_on_initiate_checkout, fire_on_purchase, fire_on_pix, fire_on_card, fire_on_boleto)
SELECT 
  p.id as product_id,
  vp.id as pixel_id,
  true as fire_on_initiate_checkout,
  true as fire_on_purchase,
  true as fire_on_pix,
  true as fire_on_card,
  true as fire_on_boleto
FROM public.vendor_pixels vp
INNER JOIN public.products p ON p.user_id = vp.vendor_id
WHERE vp.name LIKE '%(migrado)%'
ON CONFLICT (product_id, pixel_id) DO NOTHING;