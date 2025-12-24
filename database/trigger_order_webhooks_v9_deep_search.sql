-- TRIGGER v9 - Deep Search (Busca Profunda de Itens)
-- Chama a Edge Function APENAS 1 VEZ por pedido
-- A Edge Function faz a Busca Profunda e dispara webhooks para todos os itens
-- Data: 2025-11-27

CREATE OR REPLACE FUNCTION trigger_order_webhooks()
RETURNS TRIGGER AS $$
DECLARE
  supabase_url     TEXT;
  service_role_key TEXT;
  v_recursion_guard TEXT;
BEGIN
  -- Evitar recursão infinita
  v_recursion_guard := current_setting('app.webhook_processing', true);
  IF v_recursion_guard = 'true' THEN
    RETURN NEW;
  END IF;

  PERFORM set_config('app.webhook_processing', 'true', true);

  -- Log: Início do trigger
  INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
  VALUES (NEW.id, 'trigger_start_v9', 'Trigger v9 iniciado (Deep Search)', jsonb_build_object(
    'old_status', OLD.status,
    'new_status', NEW.status,
    'old_pix_qr', OLD.pix_qr_code IS NOT NULL,
    'new_pix_qr', NEW.pix_qr_code IS NOT NULL
  ));

  -- Buscar URL do Supabase
  BEGIN
    SELECT TRIM(BOTH '"' FROM value::text)
      INTO supabase_url
    FROM app_settings
    WHERE key = 'supabase_url';
    
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'supabase_url_retrieved', 'URL do Supabase recuperada', jsonb_build_object('url', supabase_url));
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'error_supabase_url', 'Erro ao buscar supabase_url', jsonb_build_object('error', SQLERRM));
    PERFORM set_config('app.webhook_processing', 'false', true);
    RETURN NEW;
  END;

  IF supabase_url IS NULL THEN
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'error_missing_url', 'supabase_url não encontrado em app_settings', NULL);
    PERFORM set_config('app.webhook_processing', 'false', true);
    RETURN NEW;
  END IF;

  -- Buscar Service Role Key
  BEGIN
    SELECT TRIM(BOTH '"' FROM value::text)
      INTO service_role_key
    FROM app_settings
    WHERE key = 'supabase_service_role_key';
    
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'service_role_key_retrieved', 'Service Role Key recuperada', jsonb_build_object(
      'key_length', length(service_role_key),
      'key_preview', substring(service_role_key from 1 for 10) || '...'
    ));
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'error_service_role_key', 'Erro ao buscar service_role_key', jsonb_build_object('error', SQLERRM));
    PERFORM set_config('app.webhook_processing', 'false', true);
    RETURN NEW;
  END;

  IF service_role_key IS NULL OR service_role_key = '' THEN
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'error_missing_key', 'supabase_service_role_key não configurado', NULL);
    PERFORM set_config('app.webhook_processing', 'false', true);
    RETURN NEW;
  END IF;

  ------------------------------------------------------------------
  -- Evento: PIX gerado
  ------------------------------------------------------------------
  IF NEW.pix_qr_code IS NOT NULL AND (OLD IS NULL OR OLD.pix_qr_code IS NULL) THEN
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'pix_generated_v9', 'Evento PIX detectado (v9) - Chamando Edge Function', jsonb_build_object('pix_id', NEW.pix_id));

    BEGIN
      -- 🚀 CHAMADA ÚNICA À EDGE FUNCTION
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/trigger-webhooks',
        body := jsonb_build_object(
          'order_id', NEW.id,
          'event_type', 'pix_generated'
          -- 🎯 NÃO PASSA product_id - A Edge Function faz a Busca Profunda
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        timeout_milliseconds := 30000
      );
      
      INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
      VALUES (NEW.id, 'pix_edge_function_called', 'Edge Function chamada com sucesso (v9)', NULL);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
      VALUES (NEW.id, 'pix_edge_function_error', 'Erro ao chamar Edge Function', jsonb_build_object('error', SQLERRM));
    END;
  END IF;

  ------------------------------------------------------------------
  -- Evento: compra aprovada (CASE INSENSITIVE)
  ------------------------------------------------------------------
  IF UPPER(NEW.status) = 'PAID' AND (OLD IS NULL OR UPPER(OLD.status) <> 'PAID') THEN
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'purchase_approved_v9', 'Evento de compra aprovada detectado (v9) - Chamando Edge Function', jsonb_build_object(
      'new_status', NEW.status,
      'old_status', OLD.status
    ));

    BEGIN
      -- 🚀 CHAMADA ÚNICA À EDGE FUNCTION
      PERFORM net.http_post(
        url := supabase_url || '/functions/v1/trigger-webhooks',
        body := jsonb_build_object(
          'order_id', NEW.id,
          'event_type', 'purchase_approved'
          -- 🎯 NÃO PASSA product_id - A Edge Function faz a Busca Profunda
        ),
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        timeout_milliseconds := 30000
      );
      
      INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
      VALUES (NEW.id, 'purchase_edge_function_called', 'Edge Function chamada com sucesso (v9)', NULL);
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
      VALUES (NEW.id, 'purchase_edge_function_error', 'Erro ao chamar Edge Function', jsonb_build_object('error', SQLERRM));
    END;
  END IF;

  PERFORM set_config('app.webhook_processing', 'false', true);
  
  INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
  VALUES (NEW.id, 'trigger_end_v9', 'Trigger v9 finalizado com sucesso', NULL);
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    PERFORM set_config('app.webhook_processing', 'false', true);
    INSERT INTO trigger_debug_logs (order_id, event_type, message, data)
    VALUES (NEW.id, 'trigger_fatal_error_v9', 'Erro fatal no trigger v9', jsonb_build_object('error', SQLERRM, 'detail', SQLSTATE));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recriar o trigger
DROP TRIGGER IF EXISTS order_webhooks_trigger ON orders;
CREATE TRIGGER order_webhooks_trigger
  AFTER INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_order_webhooks();
