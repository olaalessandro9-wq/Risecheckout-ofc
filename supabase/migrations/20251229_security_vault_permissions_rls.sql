-- ============================================================================
-- MIGRATION: Security Fix - Vault Permissions & RLS
-- Date: 2025-12-29
-- Priority: CRITICAL
-- Description: 
--   1. Revoga permissões públicas de TODAS as funções RPC do Vault
--   2. Concede acesso apenas para service_role
--   3. Ativa RLS na tabela vault.secrets
-- ============================================================================

-- ============================================================================
-- FASE 1: REVOGAR PERMISSÕES PÚBLICAS DAS FUNÇÕES DO VAULT
-- ============================================================================

-- Revogar permissões das funções ANTIGAS do Vault
REVOKE EXECUTE ON FUNCTION public.get_vault_secret(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_vault_secret(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_vault_secret(text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.save_vault_secret(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.save_vault_secret(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.save_vault_secret(text, text) FROM authenticated;

-- Revogar permissões das funções NOVAS do Vault
REVOKE EXECUTE ON FUNCTION public.vault_get_secret(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vault_get_secret(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vault_get_secret(text) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.vault_upsert_secret(text, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.vault_upsert_secret(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vault_upsert_secret(text, text) FROM authenticated;

-- ============================================================================
-- FASE 2: CONCEDER PERMISSÕES APENAS PARA SERVICE_ROLE
-- ============================================================================

-- Garantir que apenas service_role pode executar as funções do Vault
GRANT EXECUTE ON FUNCTION public.get_vault_secret(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.save_vault_secret(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_get_secret(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.vault_upsert_secret(text, text) TO service_role;

-- ============================================================================
-- FASE 3: ATIVAR RLS NA TABELA VAULT.SECRETS
-- ============================================================================

-- Ativar Row Level Security na tabela de secrets
ALTER TABLE vault.secrets ENABLE ROW LEVEL SECURITY;

-- Criar política que bloqueia todo acesso direto
-- (Acesso deve ser feito apenas via funções SECURITY DEFINER com service_role)
DROP POLICY IF EXISTS "block_all_direct_access" ON vault.secrets;
CREATE POLICY "block_all_direct_access" ON vault.secrets
    FOR ALL
    USING (false)
    WITH CHECK (false);

-- ============================================================================
-- VERIFICAÇÃO (para rodar manualmente após a migration)
-- ============================================================================
-- Execute estas queries para verificar se a migration foi aplicada corretamente:
--
-- 1. Verificar permissões das funções:
-- SELECT routine_name, grantee, privilege_type 
-- FROM information_schema.routine_privileges 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('get_vault_secret', 'save_vault_secret', 'vault_get_secret', 'vault_upsert_secret')
-- ORDER BY routine_name, grantee;
--
-- 2. Verificar RLS na tabela vault.secrets:
-- SELECT relname, relrowsecurity 
-- FROM pg_class 
-- WHERE relname = 'secrets' 
-- AND relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'vault');
--
-- 3. Verificar políticas na tabela:
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE tablename = 'secrets' AND schemaname = 'vault';
-- ============================================================================
