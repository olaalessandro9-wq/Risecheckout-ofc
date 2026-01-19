-- =====================================================
-- VAULT ACCESS LOG - EXPLICIT DENY POLICIES
-- =====================================================
-- Adiciona policies explícitas que negam acesso a todos os roles
-- Apenas service_role (que bypassa RLS) pode acessar
-- Isso resolve o warning do linter e documenta a intenção
-- =====================================================

-- Policy explícita: NINGUÉM pode SELECT (exceto service_role via bypass)
CREATE POLICY "vault_access_log_no_select" ON public.vault_access_log
  FOR SELECT
  USING (false);

-- Policy explícita: NINGUÉM pode INSERT (exceto service_role via bypass)
CREATE POLICY "vault_access_log_no_insert" ON public.vault_access_log
  FOR INSERT
  WITH CHECK (false);

-- Policy explícita: NINGUÉM pode UPDATE (exceto service_role via bypass)
CREATE POLICY "vault_access_log_no_update" ON public.vault_access_log
  FOR UPDATE
  USING (false);

-- Policy explícita: NINGUÉM pode DELETE (logs são imutáveis)
CREATE POLICY "vault_access_log_no_delete" ON public.vault_access_log
  FOR DELETE
  USING (false);

-- Comentários das policies
COMMENT ON POLICY "vault_access_log_no_select" ON public.vault_access_log IS 
'Bloqueia SELECT para todos roles. Apenas service_role acessa via RLS bypass.';

COMMENT ON POLICY "vault_access_log_no_insert" ON public.vault_access_log IS 
'Bloqueia INSERT para todos roles. Apenas log_vault_access() via SECURITY DEFINER insere.';

COMMENT ON POLICY "vault_access_log_no_update" ON public.vault_access_log IS 
'Bloqueia UPDATE. Logs de auditoria são imutáveis.';

COMMENT ON POLICY "vault_access_log_no_delete" ON public.vault_access_log IS 
'Bloqueia DELETE. Logs de auditoria não podem ser removidos manualmente.';