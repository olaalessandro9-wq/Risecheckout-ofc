-- =====================================================
-- P0-SECURITY: Corrigir trigger_order_webhooks
-- Remover hardcode do INTERNAL_WEBHOOK_SECRET
-- Usar get_internal_webhook_secret() do Vault
-- =====================================================

-- Recriar a função SEM hardcode
CREATE OR REPLACE FUNCTION public.trigger_order_webhooks()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_event_type text;
  v_supabase_url text;
  v_internal_secret text;
BEGIN
  -- Determinar tipo de evento
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

  -- Buscar URL do Supabase
  SELECT TRIM(BOTH '"' FROM value::text) INTO v_supabase_url
  FROM public.app_settings WHERE key = 'supabase_url';

  -- ✅ SECURITY FIX: Buscar secret do Vault (não mais hardcoded)
  SELECT get_internal_webhook_secret() INTO v_internal_secret;

  -- Validar configurações
  IF v_supabase_url IS NULL THEN
    RAISE WARNING '[trigger_order_webhooks] supabase_url não configurado em app_settings';
    RETURN NEW;
  END IF;

  IF v_internal_secret IS NULL OR v_internal_secret = '' THEN
    RAISE WARNING '[trigger_order_webhooks] INTERNAL_WEBHOOK_SECRET não configurado no Vault';
    RETURN NEW;
  END IF;

  -- Disparar webhook via pg_net
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
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '[trigger_order_webhooks] Erro: %', SQLERRM;
    RETURN NEW;
END;
$function$;

-- Limpar app_settings.internal_webhook_secret (não utilizado, secret está no Vault)
DELETE FROM app_settings WHERE key = 'internal_webhook_secret';

-- Log da alteração
DO $$
BEGIN
  RAISE NOTICE '✅ trigger_order_webhooks atualizado para usar Vault';
  RAISE NOTICE '✅ app_settings.internal_webhook_secret removido (redundante)';
END $$;