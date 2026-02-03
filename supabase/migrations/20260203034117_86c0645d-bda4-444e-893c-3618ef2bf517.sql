-- ============================================================================
-- RISE V3 FASE 5: LIMPEZA FINAL - DROP TABELAS LEGADAS
-- ============================================================================

-- ============================================================================
-- 1. DROP TABELA BUYER_PROFILES
-- ============================================================================
DROP TABLE IF EXISTS public.buyer_profiles CASCADE;

-- ============================================================================
-- 2. DROP TABELA PROFILES (SE EXISTIR)
-- ============================================================================
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- 3. REMOVER FUNÇÕES LEGADAS QUE REFERENCIAVAM TABELAS ANTIGAS
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_buyer_by_email(text) CASCADE;
DROP FUNCTION IF EXISTS public.create_buyer_profile(text, text, text) CASCADE;

-- ============================================================================
-- 4. LOG FINAL DE MIGRAÇÃO
-- ============================================================================
INSERT INTO public.app_settings (key, value, updated_at)
VALUES (
  'rise_v3_migration_complete',
  jsonb_build_object(
    'completed_at', NOW(),
    'description', 'RISE V3 Migration Complete - Users is now SSOT',
    'tables_dropped', ARRAY['buyer_profiles', 'profiles'],
    'ssot_table', 'users',
    'version', '3.0'
  ),
  NOW()
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================================================
-- 5. COMENTÁRIO FINAL DE AUDITORIA
-- ============================================================================
COMMENT ON TABLE public.users IS 'RISE V3 SSOT: Tabela única de identidade. Migration complete.';