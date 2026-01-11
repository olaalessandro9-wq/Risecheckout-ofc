-- =====================================================
-- SECURITY FIX: Corrigir policies RLS vulneráveis
-- 
-- PROBLEMA: 2 policies estavam com "TO public" + "USING(true)"
-- permitindo acesso não autorizado a tabelas críticas de segurança
-- 
-- SOLUÇÃO: Recriar policies com "TO service_role"
-- =====================================================

-- =====================================================
-- FIX 1: ip_blocklist
-- Antes: public podia fazer ALL operations
-- Depois: apenas service_role pode fazer ALL operations
-- =====================================================

DROP POLICY IF EXISTS "Service role can manage ip blocklist" ON ip_blocklist;

CREATE POLICY "Service role can manage ip blocklist"
ON ip_blocklist
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =====================================================
-- FIX 2: security_alerts
-- Antes: public podia fazer INSERT
-- Depois: apenas service_role pode fazer INSERT
-- =====================================================

DROP POLICY IF EXISTS "Service role can insert security alerts" ON security_alerts;

CREATE POLICY "Service role can insert security alerts"
ON security_alerts
FOR INSERT
TO service_role
WITH CHECK (true);

-- =====================================================
-- COMENTÁRIOS DE DOCUMENTAÇÃO
-- =====================================================
COMMENT ON POLICY "Service role can manage ip blocklist" ON ip_blocklist IS 
'Permite que apenas service_role (Edge Functions) gerencie a blocklist de IPs. CORRIGIDO em 2026-01-11 - anteriormente permitia acesso público.';

COMMENT ON POLICY "Service role can insert security alerts" ON security_alerts IS 
'Permite que apenas service_role (Edge Functions) insira alertas de segurança. CORRIGIDO em 2026-01-11 - anteriormente permitia acesso público.';