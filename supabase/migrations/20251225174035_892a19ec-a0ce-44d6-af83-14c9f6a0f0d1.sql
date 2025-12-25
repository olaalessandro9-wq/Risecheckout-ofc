-- =====================================================
-- P1-CLEANUP: Limpar stripe_public_key residual
-- Remover pk_test_ hardcoded de checkouts
-- =====================================================

-- Limpar checkouts com chave de teste hardcoded
UPDATE public.checkouts 
SET stripe_public_key = NULL 
WHERE stripe_public_key LIKE 'pk_test_%';

-- Log da alteração
DO $$
DECLARE
  v_count integer;
BEGIN
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '✅ % checkout(s) limpos de stripe_public_key hardcoded', v_count;
END $$;