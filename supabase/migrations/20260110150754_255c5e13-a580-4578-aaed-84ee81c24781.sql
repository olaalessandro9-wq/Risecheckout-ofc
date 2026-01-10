-- ============================================
-- RISE PROTOCOL SECURITY FIX: RLS Policies
-- ============================================
-- Corrige políticas permissivas em producer_sessions e producer_audit_log
-- que permitiam acesso de anon/authenticated (CRÍTICO)

-- ============================================
-- 1. PRODUCER_SESSIONS - Corrigir RLS
-- ============================================

-- Remover políticas permissivas existentes
DROP POLICY IF EXISTS "Service role can manage producer_sessions" ON producer_sessions;

-- Criar política restritiva: SOMENTE service_role pode acessar
CREATE POLICY "producer_sessions_service_role_only" 
ON producer_sessions 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Bloquear explicitamente anon e authenticated
CREATE POLICY "producer_sessions_deny_anon" 
ON producer_sessions 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "producer_sessions_deny_authenticated" 
ON producer_sessions 
FOR ALL 
TO authenticated
USING (false) 
WITH CHECK (false);

-- ============================================
-- 2. PRODUCER_AUDIT_LOG - Corrigir RLS
-- ============================================

-- Remover políticas permissivas existentes
DROP POLICY IF EXISTS "Service role can manage producer_audit_log" ON producer_audit_log;

-- Criar política restritiva: SOMENTE service_role pode acessar
CREATE POLICY "producer_audit_log_service_role_only" 
ON producer_audit_log 
FOR ALL 
TO service_role
USING (true) 
WITH CHECK (true);

-- Bloquear explicitamente anon e authenticated
CREATE POLICY "producer_audit_log_deny_anon" 
ON producer_audit_log 
FOR ALL 
TO anon
USING (false) 
WITH CHECK (false);

CREATE POLICY "producer_audit_log_deny_authenticated" 
ON producer_audit_log 
FOR ALL 
TO authenticated
USING (false) 
WITH CHECK (false);