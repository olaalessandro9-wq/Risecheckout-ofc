-- ============================================================================
-- RISE V3: Remover coluna legada users.utmify_token
-- Esta coluna NUNCA foi usada (tokens vão para Vault via vault-save)
-- ============================================================================

-- Safety check: Falhar se houver dados não migrados
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count 
  FROM public.users 
  WHERE utmify_token IS NOT NULL;
  
  IF v_count > 0 THEN
    RAISE EXCEPTION 'ABORT: Encontrados % registros com utmify_token não-nulo. Migrar para Vault antes de remover.', v_count;
  END IF;
END $$;

-- Remover índice primeiro (dependency)
DROP INDEX IF EXISTS public.idx_users_utmify_token;

-- Remover coluna
ALTER TABLE public.users DROP COLUMN IF EXISTS utmify_token;