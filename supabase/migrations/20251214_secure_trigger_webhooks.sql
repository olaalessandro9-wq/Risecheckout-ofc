-- Migration: Proteger trigger-webhooks (P0-5)
-- Data: 2025-12-14
-- Objetivo: Adicionar autenticação interna ao trigger SQL

-- 1) Criar função helper para buscar secret do Vault (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_internal_webhook_secret()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'INTERNAL_WEBHOOK_SECRET'
  LIMIT 1;
$$;

-- 2) Revogar acesso público
REVOKE ALL ON FUNCTION get_internal_webhook_secret() FROM PUBLIC;

-- 3) Comentário
COMMENT ON FUNCTION get_internal_webhook_secret() IS 'Busca INTERNAL_WEBHOOK_SECRET do Vault para autenticação interna (P0-5)';

-- 4) Atualizar trigger para passar secret no header
-- Nota: Apenas um exemplo - o trigger real pode estar em outro arquivo
-- Se o trigger já existir, ele precisa ser atualizado para incluir X-Internal-Secret

-- Exemplo de como o trigger SQL deve chamar a Edge Function:
/*
CREATE OR REPLACE FUNCTION trigger_webhooks_http()
RETURNS void AS $$
DECLARE
  secret TEXT;
BEGIN
  SELECT get_internal_webhook_secret() INTO secret;

  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/trigger-webhooks',
    headers := jsonb_build_object(
      'X-Internal-Secret', secret,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object('order_id', NEW.id, 'event_type', 'order.updated')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/

-- Log
DO $$
BEGIN
  RAISE NOTICE 'Função get_internal_webhook_secret() criada com sucesso';
  RAISE NOTICE 'ATENÇÃO: Você precisa configurar INTERNAL_WEBHOOK_SECRET no Vault do Supabase!';
  RAISE NOTICE 'ATENÇÃO: Você precisa atualizar o trigger SQL para passar X-Internal-Secret!';
END $$;
