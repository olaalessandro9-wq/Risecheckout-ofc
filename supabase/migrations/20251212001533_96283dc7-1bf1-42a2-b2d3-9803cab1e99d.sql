-- Recriar a função e trigger para disparar webhooks
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
  -- Determinar o tipo de evento baseado na mudança de status
  IF TG_OP = 'UPDATE' THEN
    -- Só dispara quando status muda para PAID
    IF UPPER(NEW.status) = 'PAID' AND UPPER(COALESCE(OLD.status, '')) != 'PAID' THEN
      v_event_type := 'purchase_approved';
    -- Dispara quando PIX é gerado (pendente com pix_qr_code)
    ELSIF NEW.pix_qr_code IS NOT NULL AND OLD.pix_qr_code IS NULL THEN
      v_event_type := 'pix_generated';
    ELSE
      -- Sem evento para disparar
      RETURN NEW;
    END IF;
  ELSE
    -- INSERT não dispara webhook (pedido ainda está pendente)
    RETURN NEW;
  END IF;

  -- Buscar URL do Supabase da tabela app_settings
  SELECT TRIM(BOTH '"' FROM value::text) INTO v_supabase_url
  FROM public.app_settings
  WHERE key = 'supabase_url';

  -- Buscar service_role_key da tabela app_settings
  SELECT TRIM(BOTH '"' FROM value::text) INTO v_service_key
  FROM public.app_settings
  WHERE key = 'service_role_key';

  -- Se não encontrar as configurações, logar e sair
  IF v_supabase_url IS NULL OR v_service_key IS NULL THEN
    RAISE WARNING '[trigger_order_webhooks] Configuração ausente: supabase_url ou service_role_key';
    RETURN NEW;
  END IF;

  -- Chamar a Edge Function trigger-webhooks via pg_net
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

  RAISE NOTICE '[trigger_order_webhooks] Webhook disparado: order=%, event=%', NEW.id, v_event_type;

  RETURN NEW;
END;
$function$;

-- Dropar trigger existente se houver
DROP TRIGGER IF EXISTS order_webhooks_trigger ON public.orders;

-- Criar trigger
CREATE TRIGGER order_webhooks_trigger
  AFTER INSERT OR UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_order_webhooks();