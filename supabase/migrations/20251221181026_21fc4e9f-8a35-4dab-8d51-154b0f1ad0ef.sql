-- ============================================================================
-- SECURITY FIXES: Views SECURITY INVOKER + webhook_products RLS + search_path
-- ============================================================================

-- 1) RECRIAR VIEW marketplace_products COM SECURITY INVOKER
DROP VIEW IF EXISTS public.marketplace_products;
CREATE VIEW public.marketplace_products
WITH (security_invoker = true)
AS
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
  p.user_id as producer_id,
  pr.name as producer_name,
  -- Affiliate settings
  (p.affiliate_settings->>'commission_percentage')::integer as commission_percentage,
  (p.affiliate_settings->>'cookie_duration_days')::integer as cookie_duration_days,
  (p.affiliate_settings->>'approval_mode')::text as approval_mode,
  COALESCE((p.affiliate_settings->>'requires_manual_approval')::boolean, false) as requires_manual_approval,
  COALESCE((p.affiliate_settings->>'has_upsell')::boolean, false) as has_upsell,
  COALESCE((p.affiliate_settings->>'has_order_bump_commission')::boolean, false) as has_order_bump_commission,
  -- Calculated fields
  (SELECT COUNT(*) FROM affiliates a WHERE a.product_id = p.id AND a.status = 'approved')::integer as total_affiliates,
  CASE 
    WHEN COALESCE(p.marketplace_views, 0) > 0 
    THEN ROUND((COALESCE(p.marketplace_clicks, 0)::numeric / p.marketplace_views::numeric) * 100, 2)
    ELSE 0
  END as conversion_rate,
  COALESCE(p.marketplace_views, 0) + COALESCE(p.marketplace_clicks, 0) as popularity_score
FROM products p
LEFT JOIN profiles pr ON p.user_id = pr.id
WHERE p.show_in_marketplace = true
  AND (p.affiliate_settings->>'enabled')::boolean = true;

-- 2) RECRIAR VIEW vendor_integrations_public COM SECURITY INVOKER
DROP VIEW IF EXISTS public.vendor_integrations_public;
CREATE VIEW public.vendor_integrations_public
WITH (security_invoker = true)
AS
SELECT
  id,
  vendor_id,
  integration_type,
  active,
  created_at,
  updated_at,
  -- Expor apenas campos não-sensíveis do config
  jsonb_build_object(
    'test_mode', config->>'test_mode',
    'connected', config->>'connected'
  ) as config
FROM vendor_integrations;

-- 3) CORRIGIR RLS DE webhook_products (remover política permissiva)
DROP POLICY IF EXISTS "Service role full access on webhook_products" ON public.webhook_products;

-- Criar política restritiva: vendors só veem seus próprios webhooks
CREATE POLICY "Vendors can manage their own webhook_products"
ON public.webhook_products
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM outbound_webhooks ow
    WHERE ow.id = webhook_products.webhook_id
    AND ow.vendor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM outbound_webhooks ow
    WHERE ow.id = webhook_products.webhook_id
    AND ow.vendor_id = auth.uid()
  )
);

-- 4) ADICIONAR search_path EM FUNÇÕES SECURITY DEFINER
-- (Recriando apenas as que estão sem search_path explícito)

CREATE OR REPLACE FUNCTION public.save_vault_secret(p_name text, p_secret text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ BEGIN RETURN vault.create_secret(p_secret, p_name); END; $$;

CREATE OR REPLACE FUNCTION public.get_vault_secret(p_name text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
DECLARE v_secret text; 
BEGIN 
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = p_name; 
  RETURN v_secret; 
END; $$;

CREATE OR REPLACE FUNCTION public.get_internal_webhook_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'INTERNAL_WEBHOOK_SECRET'
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.increment_marketplace_view(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products 
  SET marketplace_views = COALESCE(marketplace_views, 0) + 1
  WHERE id = p_product_id 
    AND show_in_marketplace = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_marketplace_click(p_product_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products 
  SET marketplace_clicks = COALESCE(marketplace_clicks, 0) + 1
  WHERE id = p_product_id 
    AND show_in_marketplace = true;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_system_metric(
  p_metric_type text, 
  p_metric_value numeric DEFAULT NULL, 
  p_metadata jsonb DEFAULT '{}'::jsonb, 
  p_severity text DEFAULT 'info'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO public.system_health_logs (metric_type, metric_value, metadata, severity)
  VALUES (p_metric_type, p_metric_value, p_metadata, p_severity)
  RETURNING id INTO v_log_id;
  RETURN v_log_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_vendor_public_key(p_vendor_id uuid)
RETURNS TABLE(public_key text, test_mode_enabled boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
BEGIN 
  RETURN QUERY 
  SELECT p.test_public_key::TEXT as public_key, p.test_mode_enabled as test_mode_enabled 
  FROM profiles p 
  WHERE p.id = p_vendor_id AND p.test_mode_enabled = true AND p.test_public_key IS NOT NULL 
  LIMIT 1; 
  
  IF NOT FOUND THEN 
    RETURN QUERY 
    SELECT (vi.config->>'public_key')::TEXT as public_key, false as test_mode_enabled 
    FROM vendor_integrations vi 
    WHERE vi.vendor_id = p_vendor_id AND vi.integration_type = 'MERCADOPAGO' AND vi.active = true AND vi.config->>'public_key' IS NOT NULL 
    LIMIT 1; 
  END IF; 
END; $$;

CREATE OR REPLACE FUNCTION public.sync_checkout_payment_keys()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$ 
BEGIN 
  SELECT vi.config->>'public_key' INTO NEW.mercadopago_public_key 
  FROM vendor_integrations vi 
  INNER JOIN products p ON p.user_id = vi.vendor_id 
  WHERE p.id = NEW.product_id AND vi.integration_type = 'MERCADOPAGO' AND vi.active = true 
  LIMIT 1; 
  
  SELECT vi.config->>'publishable_key' INTO NEW.stripe_public_key 
  FROM vendor_integrations vi 
  INNER JOIN products p ON p.user_id = vi.vendor_id 
  WHERE p.id = NEW.product_id AND vi.integration_type = 'STRIPE' AND vi.active = true 
  LIMIT 1; 
  
  RETURN NEW; 
END; $$;

CREATE OR REPLACE FUNCTION public.notify_producer_new_affiliate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_name TEXT;
  v_affiliate_name TEXT;
  v_producer_id UUID;
BEGIN
  IF NEW.status = 'pending' THEN
    SELECT p.name, p.user_id INTO v_product_name, v_producer_id
    FROM products p WHERE p.id = NEW.product_id;
    
    SELECT prof.name INTO v_affiliate_name
    FROM profiles prof WHERE prof.id = NEW.user_id;
    
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
      v_producer_id,
      'new_affiliate_request',
      'Nova solicitação de afiliação',
      v_affiliate_name || ' solicitou promover "' || v_product_name || '"',
      jsonb_build_object(
        'affiliate_id', NEW.id,
        'product_id', NEW.product_id,
        'affiliate_user_id', NEW.user_id,
        'product_name', v_product_name,
        'affiliate_name', v_affiliate_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_process_webhook_queue()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  secret TEXT;
  request_id BIGINT;
BEGIN
  IF NEW.status NOT IN ('pending', 'failed') THEN
    RETURN NEW;
  END IF;

  IF NEW.attempts >= 5 THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' AND NEW.status = 'success' THEN
    RETURN NEW;
  END IF;

  SELECT get_internal_webhook_secret() INTO secret;
  
  IF secret IS NULL OR secret = '' THEN
    RAISE WARNING 'INTERNAL_WEBHOOK_SECRET não configurado';
    RETURN NEW;
  END IF;
  
  SELECT net.http_post(
    url := 'https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/process-webhook-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', secret
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'webhook_id', NEW.webhook_id,
        'order_id', NEW.order_id,
        'event_type', NEW.event_type,
        'status', NEW.status,
        'attempts', NEW.attempts
      )
    )
  ) INTO request_id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro no trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_order_webhooks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_event_type text;
  v_supabase_url text;
  v_internal_secret text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF UPPER(NEW.status) = 'PAID' AND UPPER(COALESCE(OLD.status, '')) != 'PAID' THEN
      v_event_type := 'purchase_approved';
    ELSIF NEW.pix_qr_code IS NOT NULL AND OLD.pix_qr_code IS NULL THEN
      v_event_type := 'pix_generated';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  SELECT TRIM(BOTH '"' FROM value::text) INTO v_supabase_url
  FROM public.app_settings WHERE key = 'supabase_url';

  v_internal_secret := '39e3cfc2-9a7b-4f6d-b1e2-9b90be3f0a56';

  IF v_supabase_url IS NULL THEN
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/trigger-webhooks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', v_internal_secret
    ),
    body := jsonb_build_object(
      'order_id', NEW.id,
      'event_type', v_event_type
    )
  );

  RETURN NEW;
END;
$$;