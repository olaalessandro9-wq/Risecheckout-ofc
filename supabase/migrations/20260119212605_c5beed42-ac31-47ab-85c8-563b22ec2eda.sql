-- ============================================================================
-- RISE Protocol V3 - Fix Critical RLS Policies for Audit Tables
-- ============================================================================
-- Fixes identified by rls-security-tester:
-- 1. security_audit_log: Missing INSERT/UPDATE/DELETE policies
-- 2. affiliate_audit_log: Missing UPDATE/DELETE policies
-- ============================================================================

-- ============================================================================
-- SECURITY_AUDIT_LOG POLICIES
-- ============================================================================
-- This is an audit table - should only be modified by service_role (triggers/edge functions)

-- Policy: INSERT for service_role (internal triggers and edge functions)
CREATE POLICY "security_audit_log_insert_service"
  ON public.security_audit_log 
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: UPDATE for service_role (rare, but needed for corrections)
CREATE POLICY "security_audit_log_update_service"
  ON public.security_audit_log 
  FOR UPDATE
  TO service_role
  USING (true);

-- Policy: DELETE for service_role (data retention cleanup)
CREATE POLICY "security_audit_log_delete_service"
  ON public.security_audit_log 
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================================================
-- AFFILIATE_AUDIT_LOG POLICIES  
-- ============================================================================
-- This is an audit table - should only be modified by service_role

-- Policy: UPDATE for service_role (rare, but needed for corrections)
CREATE POLICY "affiliate_audit_log_update_service"
  ON public.affiliate_audit_log 
  FOR UPDATE
  TO service_role
  USING (true);

-- Policy: DELETE for service_role (data retention cleanup)
CREATE POLICY "affiliate_audit_log_delete_service"
  ON public.affiliate_audit_log 
  FOR DELETE
  TO service_role
  USING (true);

-- ============================================================================
-- VERIFICATION COMMENT
-- ============================================================================
-- After this migration:
-- security_audit_log: SELECT (admins), INSERT/UPDATE/DELETE (service_role)
-- affiliate_audit_log: SELECT/INSERT (existing), UPDATE/DELETE (service_role)
-- Run rls-security-tester to validate: 0 critical failures expected
-- ============================================================================