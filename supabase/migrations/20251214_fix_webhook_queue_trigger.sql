-- Migration: Corrigir trigger process-webhook-queue (P0-5)
-- Data: 2025-12-14
-- Objetivo: Remover service_role_key do trigger e usar INTERNAL_WEBHOOK_SECRET

-- 1) Dropar trigger antigo (vulnerável)
DROP TRIGGER IF EXISTS "process-webhook-queue-trigger" ON webhook_deliveries;

-- 2) Criar função helper para chamar Edge Function com secret seguro
CREATE OR REPLACE FUNCTION trigger_process_webhook_queue()
RETURNS TRIGGER AS $$
DECLARE
  secret TEXT;
  response TEXT;
BEGIN
  -- Buscar secret do Vault
  SELECT get_internal_webhook_secret() INTO secret;
  
  -- Chamar Edge Function com X-Internal-Secret
  SELECT content INTO response
  FROM http((
    'POST',
    'https://wivbtmtgpsxupfjwwovf.supabase.co/functions/v1/process-webhook-queue',
    ARRAY[
      http_header('Content-Type', 'application/json'),
      http_header('X-Internal-Secret', secret)
    ],
    'application/json',
    '{}'
  )::http_request);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Revogar acesso público
REVOKE ALL ON FUNCTION trigger_process_webhook_queue() FROM PUBLIC;

-- 4) Criar novo trigger (seguro)
CREATE TRIGGER "process-webhook-queue-trigger"
  AFTER INSERT ON webhook_deliveries
  FOR EACH ROW
  EXECUTE FUNCTION trigger_process_webhook_queue();

-- 5) Comentário
COMMENT ON FUNCTION trigger_process_webhook_queue() IS 'Trigger seguro para process-webhook-queue usando INTERNAL_WEBHOOK_SECRET do Vault (P0-5)';

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Trigger process-webhook-queue-trigger corrigido (sem service_role_key)';
  RAISE NOTICE 'ATENÇÃO: Certifique-se de que INTERNAL_WEBHOOK_SECRET está configurado no Vault!';
END $$;
