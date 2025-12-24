
-- Garantir que a extensão pg_net está habilitada
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Recriar a função trigger
CREATE OR REPLACE FUNCTION public.trigger_order_webhooks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event_type text;
  v_supabase_url text;
  v_service_key text;
BEGIN
  -- Determinar o tipo de evento baseado na mudança
  IF TG_OP = 'UPDATE' THEN
    -- Dispara quando status muda para PAID
    IF UPPER(NEW.status) = 'PAID' AND UPPER(COALESCE(OLD.status, '')) != 'PAID' THEN
      v_event_type := 'purchase_approved';
    -- Dispara quando PIX é gerado
    ELSIF NEW.pix_qr_code IS NOT NULL AND OLD.pix_qr_code IS NULL THEN
      v_event_type := 'pix_generated';
    ELSE
      RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Buscar configurações
  SELECT TRIM(BOTH '"' FROM value::text) INTO v_supabase_url
  FROM public.app_settings WHERE key = 'supabase_url';

  SELECT TRIM(BOTH '"' FROM value::text) INTO v_service_key
  FROM public.app_settings WHERE key = 'service_role_key';

  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING '[trigger_order_webhooks] Configuração ausente';
    RETURN NEW;
  END IF;

  -- Chamar Edge Function via pg_net
  PERFORM net.http_post(
    url := v_supabase_url || '/functions/v1/trigger-webhooks',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'order_id', NEW.id,
      'event_type', v_event_type
    )
  );

  RETURN NEW;
END;
$function$;

-- Dropar trigger existente
DROP TRIGGER IF EXISTS order_webhooks_trigger ON public.orders;

-- Criar trigger
CREATE TRIGGER order_webhooks_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_webhooks();
