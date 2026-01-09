-- =====================================================
-- SECURITY FIX: Remover tokens MercadoPago expostos do banco
-- (São credenciais de TESTE - podem ser recadastradas via fluxo corrigido)
-- =====================================================

-- 1. Remover access_token do config e adicionar flag credentials_in_vault
-- O admin precisará recadastrar as credenciais usando o novo fluxo seguro
UPDATE vendor_integrations
SET config = (config - 'access_token') || '{"credentials_in_vault": false, "needs_reconfiguration": true}'::jsonb,
    active = false,
    updated_at = NOW()
WHERE integration_type = 'MERCADOPAGO'
AND config->>'access_token' IS NOT NULL;

-- 2. Verificação final: não deve haver mais tokens expostos
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM vendor_integrations
  WHERE config->>'access_token' IS NOT NULL;
  
  IF v_count > 0 THEN
    RAISE WARNING 'ATENÇÃO: Ainda existem % registros com access_token exposto!', v_count;
  ELSE
    RAISE NOTICE 'SUCCESS: Nenhum access_token exposto no banco de dados.';
  END IF;
END $$;