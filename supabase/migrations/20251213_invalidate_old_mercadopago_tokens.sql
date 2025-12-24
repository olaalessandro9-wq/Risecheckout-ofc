-- Migration: Invalidar tokens antigos do MercadoPago
-- Data: 2025-12-13
-- Objetivo: Marcar todas as integrações MercadoPago para re-autenticação após rotação de segredos

-- Atualizar todas as integrações do MercadoPago para exigir re-autenticação
UPDATE vendor_integrations
SET config = jsonb_set(
  COALESCE(config, '{}'::jsonb),
  '{needs_reauth}',
  'true'::jsonb
)
WHERE integration_type = 'mercadopago';

-- Log da operação
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Marcadas % integrações MercadoPago para re-autenticação', affected_count;
END $$;

-- Comentário
COMMENT ON COLUMN vendor_integrations.config IS 'Configuração JSON da integração. needs_reauth=true indica que o usuário precisa reconectar.';
