-- Migration: Fix hardcoded URL in create_payment_link_for_offer trigger
-- RISE Protocol V3 - Eliminates hardcoded risecheckout.com
-- Uses vault secret SITE_BASE_DOMAIN as Single Source of Truth

-- Re-create the function to use vault secret for base URL
CREATE OR REPLACE FUNCTION public.create_payment_link_for_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  link_slug TEXT;
  link_url TEXT;
  link_id UUID;
  base_url TEXT;
BEGIN
  -- Get base URL from vault (SSOT) or use fallback
  SELECT decrypted_secret INTO base_url
  FROM vault.decrypted_secrets
  WHERE name = 'SITE_BASE_DOMAIN'
  LIMIT 1;
  
  -- Build URL with dynamic base (fallback only for backwards compatibility)
  IF base_url IS NULL OR base_url = '' THEN
    base_url := 'risecheckout.com';
    RAISE WARNING 'SITE_BASE_DOMAIN not found in vault, using fallback';
  END IF;
  
  -- Generate unique slug for this offer
  link_slug := public.generate_link_slug(NEW.name, NEW.price);
  
  -- Build full URL with /c/ prefix (payment link route)
  link_url := 'https://' || base_url || '/c/' || link_slug;
  
  -- Create the payment link
  INSERT INTO public.payment_links (offer_id, slug, url)
  VALUES (NEW.id, link_slug, link_url)
  RETURNING id INTO link_id;
  
  RETURN NEW;
END;
$function$;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_payment_link_for_offer() IS 
  'RISE V3: Trigger que cria payment_link automaticamente quando uma oferta é criada. URL base vem do vault secret SITE_BASE_DOMAIN.';