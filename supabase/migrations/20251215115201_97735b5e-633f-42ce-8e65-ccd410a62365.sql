-- ============================================================================
-- Atualizar trigger para incluir guardas de segurança
-- Evita processamento de registros já bem-sucedidos ou com max tentativas
-- ============================================================================

CREATE OR REPLACE FUNCTION public.trigger_process_webhook_queue()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  secret TEXT;
  request_id BIGINT;
BEGIN
  -- GUARDA 1: Só processar status 'pending' ou 'failed' (não 'success' ou 'processing')
  IF NEW.status NOT IN ('pending', 'failed') THEN
    RAISE NOTICE '[trigger_process_webhook_queue] Ignorando status: %', NEW.status;
    RETURN NEW;
  END IF;

  -- GUARDA 2: Só processar se attempts < 5
  IF NEW.attempts >= 5 THEN
    RAISE NOTICE '[trigger_process_webhook_queue] Max attempts atingido: %', NEW.attempts;
    RETURN NEW;
  END IF;

  -- GUARDA 3: Não processar registros recém-criados com status success
  IF TG_OP = 'INSERT' AND NEW.status = 'success' THEN
    RETURN NEW;
  END IF;

  -- Buscar secret do Vault
  SELECT get_internal_webhook_secret() INTO secret;
  
  -- Validar secret
  IF secret IS NULL OR secret = '' THEN
    RAISE WARNING 'INTERNAL_WEBHOOK_SECRET não configurado, abortando trigger';
    RETURN NEW;
  END IF;
  
  -- Chamar Edge Function usando net.http_post
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
  
  RAISE NOTICE 'Trigger disparado: request_id=%, webhook_delivery_id=%, status=%, attempts=%', 
    request_id, NEW.id, NEW.status, NEW.attempts;
  
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Erro no trigger process-webhook-queue: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    RETURN NEW;
END;
$function$;

-- Garantir que o trigger existe e está correto
DROP TRIGGER IF EXISTS trigger_process_webhook_queue ON public.webhook_deliveries;

CREATE TRIGGER trigger_process_webhook_queue
  AFTER INSERT OR UPDATE ON public.webhook_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_process_webhook_queue();