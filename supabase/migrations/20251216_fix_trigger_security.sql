-- ============================================================
-- Migration: Remover service_role_key do trigger
-- Descrição: Substituir uso de service_role_key por segredo interno
-- Data: 2025-12-16
-- Segurança: Correção de vulnerabilidade ALTA
-- ============================================================

-- Recriar a função trigger SEM buscar service_role_key da tabela
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

  -- ✅ NOVO: Buscar apenas URL (não mais service_role_key)
  SELECT TRIM(BOTH '"' FROM value::text) INTO v_supabase_url
  FROM public.app_settings WHERE key = 'supabase_url';

  -- ✅ NOVO: Usar segredo interno fixo (será validado pela Edge Function)
  -- Nota: Este valor deve corresponder ao INTERNAL_WEBHOOK_SECRET no Supabase Secrets
  v_internal_secret := '39e3cfc2-9a7b-4f6d-b1e2-9b90be3f0a56';

  IF v_supabase_url IS NULL THEN
    RAISE WARNING '[trigger_order_webhooks] supabase_url ausente';
    RETURN NEW;
  END IF;

  -- ✅ NOVO: Usar X-Internal-Secret em vez de Authorization com service_role_key
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
$function$;

-- Comentário para documentação
COMMENT ON FUNCTION public.trigger_order_webhooks() IS 'Trigger para disparar webhooks quando pedidos mudam de status. Usa segredo interno em vez de service_role_key para maior segurança.';
