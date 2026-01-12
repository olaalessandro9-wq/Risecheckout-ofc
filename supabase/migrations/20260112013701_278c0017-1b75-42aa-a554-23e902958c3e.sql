-- Complete Phase 6: Migrate all pixels from vendor_integrations

-- Step 1: Migrate Facebook Pixels
INSERT INTO public.vendor_pixels (vendor_id, platform, name, pixel_id, access_token, domain, is_active)
SELECT 
  vi.vendor_id,
  'facebook' as platform,
  'Facebook Pixel (migrado)' as name,
  vi.config->>'pixel_id' as pixel_id,
  vi.config->>'access_token' as access_token,
  vi.config->>'domain' as domain,
  vi.active
FROM public.vendor_integrations vi
WHERE vi.integration_type = 'facebook_pixel'
  AND vi.config->>'pixel_id' IS NOT NULL
  AND vi.config->>'pixel_id' != ''
ON CONFLICT (vendor_id, platform, pixel_id) DO NOTHING;

-- Step 2: Migrate TikTok Pixels
INSERT INTO public.vendor_pixels (vendor_id, platform, name, pixel_id, access_token, is_active)
SELECT 
  vi.vendor_id,
  'tiktok' as platform,
  'TikTok Pixel (migrado)' as name,
  vi.config->>'pixel_id' as pixel_id,
  vi.config->>'access_token' as access_token,
  vi.active
FROM public.vendor_integrations vi
WHERE vi.integration_type = 'tiktok_pixel'
  AND vi.config->>'pixel_id' IS NOT NULL
  AND vi.config->>'pixel_id' != ''
ON CONFLICT (vendor_id, platform, pixel_id) DO NOTHING;

-- Step 3: Migrate Google Ads Pixels
INSERT INTO public.vendor_pixels (vendor_id, platform, name, pixel_id, conversion_label, is_active)
SELECT 
  vi.vendor_id,
  'google_ads' as platform,
  'Google Ads (migrado)' as name,
  vi.config->>'conversion_id' as pixel_id,
  vi.config->>'conversion_label' as conversion_label,
  vi.active
FROM public.vendor_integrations vi
WHERE vi.integration_type = 'google_ads'
  AND vi.config->>'conversion_id' IS NOT NULL
  AND vi.config->>'conversion_id' != ''
ON CONFLICT (vendor_id, platform, pixel_id) DO NOTHING;

-- Step 4: Migrate Kwai Pixels
INSERT INTO public.vendor_pixels (vendor_id, platform, name, pixel_id, is_active)
SELECT 
  vi.vendor_id,
  'kwai' as platform,
  'Kwai Pixel (migrado)' as name,
  vi.config->>'pixel_id' as pixel_id,
  vi.active
FROM public.vendor_integrations vi
WHERE vi.integration_type = 'kwai_pixel'
  AND vi.config->>'pixel_id' IS NOT NULL
  AND vi.config->>'pixel_id' != ''
ON CONFLICT (vendor_id, platform, pixel_id) DO NOTHING;

-- Step 5: Link all migrated pixels to all products of each vendor
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