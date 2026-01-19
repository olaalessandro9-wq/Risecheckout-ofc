-- =========================================================================
-- CENTRALIZED DATA RETENTION SYSTEM - RISE Protocol V3 Compliant
-- =========================================================================
-- Purpose: Unify all data cleanup functions into a modular, maintainable system
-- Retention policies defined per table category
-- =========================================================================

-- Drop existing functions with incompatible signatures
DROP FUNCTION IF EXISTS public.cleanup_expired_buyer_sessions();
DROP FUNCTION IF EXISTS public.cleanup_expired_producer_sessions();
DROP FUNCTION IF EXISTS public.cleanup_old_rate_limit_attempts();
DROP FUNCTION IF EXISTS public.cleanup_old_security_events();
DROP FUNCTION IF EXISTS public.cleanup_by_category(TEXT);
DROP FUNCTION IF EXISTS public.cleanup_dry_run();
DROP FUNCTION IF EXISTS public.cleanup_all_data();
DROP FUNCTION IF EXISTS public.cleanup_all_data_with_log();

-- =========================================================================
-- SECTION 1: INDIVIDUAL CLEANUP FUNCTIONS (Single Responsibility)
-- =========================================================================

-- 1.1 OAuth States Cleanup (1 hour retention for expired, immediate for used)
CREATE OR REPLACE FUNCTION public.cleanup_oauth_states()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM oauth_states
  WHERE expires_at < NOW() - INTERVAL '1 hour'
     OR used_at IS NOT NULL;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_oauth_states() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_oauth_states() TO service_role;

-- 1.2 Vault Access Log Cleanup (90 days retention)
CREATE OR REPLACE FUNCTION public.cleanup_vault_access_log()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM vault_access_log
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_vault_access_log() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_vault_access_log() TO service_role;

-- 1.3 Key Rotation Log Cleanup (365 days retention)
CREATE OR REPLACE FUNCTION public.cleanup_key_rotation_log()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM key_rotation_log
  WHERE started_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_key_rotation_log() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_key_rotation_log() TO service_role;

-- 1.4 Old Encryption Keys Cleanup (keep last 3 active versions)
CREATE OR REPLACE FUNCTION public.cleanup_old_encryption_keys()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
  v_min_version INTEGER;
BEGIN
  SELECT COALESCE(MAX(version) - 2, 0) INTO v_min_version
  FROM encryption_key_versions
  WHERE status = 'active';
  
  DELETE FROM encryption_key_versions
  WHERE status IN ('revoked', 'deprecated')
    AND version < v_min_version
    AND revoked_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_old_encryption_keys() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_encryption_keys() TO service_role;

-- 1.5 Expired Producer Sessions Cleanup (expired + 7 days grace)
CREATE OR REPLACE FUNCTION public.cleanup_expired_producer_sessions()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM producer_sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_producer_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_producer_sessions() TO service_role;

-- 1.6 Expired Buyer Sessions Cleanup (expired + 7 days grace)
CREATE OR REPLACE FUNCTION public.cleanup_expired_buyer_sessions()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM buyer_sessions
  WHERE expires_at < NOW() - INTERVAL '7 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_buyer_sessions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_buyer_sessions() TO service_role;

-- 1.7 GDPR Requests Cleanup (90 days after processing)
CREATE OR REPLACE FUNCTION public.cleanup_gdpr_requests()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM gdpr_requests
  WHERE status IN ('completed', 'rejected')
    AND processed_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_gdpr_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_gdpr_requests() TO service_role;

-- 1.8 GDPR Audit Log Cleanup (365 days retention for compliance)
CREATE OR REPLACE FUNCTION public.cleanup_gdpr_audit_log()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM gdpr_audit_log
  WHERE executed_at < NOW() - INTERVAL '365 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_gdpr_audit_log() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_gdpr_audit_log() TO service_role;

-- 1.9 Rate Limit Attempts Cleanup (24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_rate_limit_attempts()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM rate_limit_attempts
  WHERE created_at < NOW() - INTERVAL '24 hours';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_rate_limit_attempts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_rate_limit_attempts() TO service_role;

-- 1.10 Security Events Cleanup (90 days)
CREATE OR REPLACE FUNCTION public.cleanup_security_events()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM security_events
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_security_events() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_security_events() TO service_role;

-- 1.11 Buyer Rate Limits Cleanup (24 hours for expired blocks)
CREATE OR REPLACE FUNCTION public.cleanup_buyer_rate_limits()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count BIGINT := 0;
BEGIN
  DELETE FROM buyer_rate_limits
  WHERE (blocked_until IS NOT NULL AND blocked_until < NOW() - INTERVAL '24 hours')
     OR (blocked_until IS NULL AND last_attempt_at < NOW() - INTERVAL '24 hours');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_buyer_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_buyer_rate_limits() TO service_role;

-- =========================================================================
-- SECTION 2: UNIFIED ORCHESTRATOR FUNCTION
-- =========================================================================

CREATE OR REPLACE FUNCTION public.cleanup_all_data_v2()
RETURNS TABLE(
  category TEXT,
  table_name TEXT,
  rows_deleted BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- OAuth Category
  RETURN QUERY SELECT 'oauth'::TEXT, 'oauth_states'::TEXT, cleanup_oauth_states();
  
  -- Sessions Category
  RETURN QUERY SELECT 'sessions'::TEXT, 'producer_sessions'::TEXT, cleanup_expired_producer_sessions();
  RETURN QUERY SELECT 'sessions'::TEXT, 'buyer_sessions'::TEXT, cleanup_expired_buyer_sessions();
  
  -- Security Logs Category
  RETURN QUERY SELECT 'security'::TEXT, 'vault_access_log'::TEXT, cleanup_vault_access_log();
  RETURN QUERY SELECT 'security'::TEXT, 'key_rotation_log'::TEXT, cleanup_key_rotation_log();
  RETURN QUERY SELECT 'security'::TEXT, 'encryption_key_versions'::TEXT, cleanup_old_encryption_keys();
  RETURN QUERY SELECT 'security'::TEXT, 'security_events'::TEXT, cleanup_security_events();
  
  -- GDPR Category
  RETURN QUERY SELECT 'gdpr'::TEXT, 'gdpr_requests'::TEXT, cleanup_gdpr_requests();
  RETURN QUERY SELECT 'gdpr'::TEXT, 'gdpr_audit_log'::TEXT, cleanup_gdpr_audit_log();
  
  -- Rate Limiting Category
  RETURN QUERY SELECT 'rate_limit'::TEXT, 'rate_limit_attempts'::TEXT, cleanup_rate_limit_attempts();
  RETURN QUERY SELECT 'rate_limit'::TEXT, 'buyer_rate_limits'::TEXT, cleanup_buyer_rate_limits();
  
  -- Existing cleanup (delegated to original function for compatibility)
  RETURN QUERY SELECT 'legacy'::TEXT, t.table_name, t.rows_deleted FROM cleanup_old_data() t;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_all_data_v2() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_all_data_v2() TO service_role;

-- =========================================================================
-- SECTION 3: EXTENDED DATA RETENTION LOG TABLE
-- =========================================================================

ALTER TABLE public.data_retention_log
ADD COLUMN IF NOT EXISTS oauth_states_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS producer_sessions_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS buyer_sessions_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS vault_access_log_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS key_rotation_log_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS encryption_keys_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS gdpr_requests_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS gdpr_audit_log_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS rate_limit_attempts_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS buyer_rate_limits_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS security_events_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_rows_deleted BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS cleanup_version TEXT DEFAULT 'v2';

-- =========================================================================
-- SECTION 4: UPDATED ORCHESTRATOR WITH LOGGING
-- =========================================================================

CREATE OR REPLACE FUNCTION public.cleanup_all_data_v2_with_log()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ := clock_timestamp();
  v_results RECORD;
  v_oauth BIGINT := 0;
  v_producer_sessions BIGINT := 0;
  v_buyer_sessions BIGINT := 0;
  v_vault_log BIGINT := 0;
  v_key_rotation BIGINT := 0;
  v_encryption_keys BIGINT := 0;
  v_gdpr_requests BIGINT := 0;
  v_gdpr_audit BIGINT := 0;
  v_rate_limit BIGINT := 0;
  v_buyer_rate_limit BIGINT := 0;
  v_security_events BIGINT := 0;
  v_trigger BIGINT := 0;
  v_audit BIGINT := 0;
  v_visits BIGINT := 0;
  v_deliveries BIGINT := 0;
  v_dlq BIGINT := 0;
  v_events BIGINT := 0;
  v_total BIGINT := 0;
BEGIN
  FOR v_results IN SELECT * FROM cleanup_all_data_v2() LOOP
    v_total := v_total + v_results.rows_deleted;
    
    CASE v_results.table_name
      WHEN 'oauth_states' THEN v_oauth := v_results.rows_deleted;
      WHEN 'producer_sessions' THEN v_producer_sessions := v_results.rows_deleted;
      WHEN 'buyer_sessions' THEN v_buyer_sessions := v_results.rows_deleted;
      WHEN 'vault_access_log' THEN v_vault_log := v_results.rows_deleted;
      WHEN 'key_rotation_log' THEN v_key_rotation := v_results.rows_deleted;
      WHEN 'encryption_key_versions' THEN v_encryption_keys := v_results.rows_deleted;
      WHEN 'gdpr_requests' THEN v_gdpr_requests := v_results.rows_deleted;
      WHEN 'gdpr_audit_log' THEN v_gdpr_audit := v_results.rows_deleted;
      WHEN 'rate_limit_attempts' THEN v_rate_limit := v_results.rows_deleted;
      WHEN 'buyer_rate_limits' THEN v_buyer_rate_limit := v_results.rows_deleted;
      WHEN 'security_events' THEN v_security_events := v_results.rows_deleted;
      WHEN 'trigger_debug_logs' THEN v_trigger := v_results.rows_deleted;
      WHEN 'security_audit_log' THEN v_audit := v_results.rows_deleted;
      WHEN 'checkout_visits' THEN v_visits := v_results.rows_deleted;
      WHEN 'webhook_deliveries' THEN v_deliveries := v_results.rows_deleted;
      WHEN 'gateway_webhook_dlq' THEN v_dlq := v_results.rows_deleted;
      WHEN 'order_events' THEN v_events := v_results.rows_deleted;
      ELSE NULL;
    END CASE;
  END LOOP;

  INSERT INTO data_retention_log (
    oauth_states_deleted,
    producer_sessions_deleted,
    buyer_sessions_deleted,
    vault_access_log_deleted,
    key_rotation_log_deleted,
    encryption_keys_deleted,
    gdpr_requests_deleted,
    gdpr_audit_log_deleted,
    rate_limit_attempts_deleted,
    buyer_rate_limits_deleted,
    security_events_deleted,
    trigger_debug_logs_deleted,
    security_audit_log_deleted,
    checkout_visits_deleted,
    webhook_deliveries_deleted,
    gateway_webhook_dlq_deleted,
    order_events_deleted,
    total_rows_deleted,
    execution_time_ms,
    cleanup_version
  ) VALUES (
    v_oauth,
    v_producer_sessions,
    v_buyer_sessions,
    v_vault_log,
    v_key_rotation,
    v_encryption_keys,
    v_gdpr_requests,
    v_gdpr_audit,
    v_rate_limit,
    v_buyer_rate_limit,
    v_security_events,
    v_trigger,
    v_audit,
    v_visits,
    v_deliveries,
    v_dlq,
    v_events,
    v_total,
    EXTRACT(MILLISECONDS FROM clock_timestamp() - v_start)::INTEGER,
    'v2'
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_all_data_v2_with_log() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_all_data_v2_with_log() TO service_role;

-- =========================================================================
-- SECTION 5: CATEGORY-SPECIFIC CLEANUP FUNCTIONS
-- =========================================================================

CREATE OR REPLACE FUNCTION public.cleanup_by_category(p_category TEXT)
RETURNS TABLE(table_name TEXT, rows_deleted BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  CASE p_category
    WHEN 'oauth' THEN
      RETURN QUERY SELECT 'oauth_states'::TEXT, cleanup_oauth_states();
      
    WHEN 'sessions' THEN
      RETURN QUERY SELECT 'producer_sessions'::TEXT, cleanup_expired_producer_sessions();
      RETURN QUERY SELECT 'buyer_sessions'::TEXT, cleanup_expired_buyer_sessions();
      
    WHEN 'security' THEN
      RETURN QUERY SELECT 'vault_access_log'::TEXT, cleanup_vault_access_log();
      RETURN QUERY SELECT 'key_rotation_log'::TEXT, cleanup_key_rotation_log();
      RETURN QUERY SELECT 'encryption_key_versions'::TEXT, cleanup_old_encryption_keys();
      RETURN QUERY SELECT 'security_events'::TEXT, cleanup_security_events();
      
    WHEN 'gdpr' THEN
      RETURN QUERY SELECT 'gdpr_requests'::TEXT, cleanup_gdpr_requests();
      RETURN QUERY SELECT 'gdpr_audit_log'::TEXT, cleanup_gdpr_audit_log();
      
    WHEN 'rate_limit' THEN
      RETURN QUERY SELECT 'rate_limit_attempts'::TEXT, cleanup_rate_limit_attempts();
      RETURN QUERY SELECT 'buyer_rate_limits'::TEXT, cleanup_buyer_rate_limits();
      
    WHEN 'legacy' THEN
      RETURN QUERY SELECT t.table_name, t.rows_deleted FROM cleanup_old_data() t;
      
    ELSE
      RAISE EXCEPTION 'Unknown category: %', p_category;
  END CASE;
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_by_category(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_by_category(TEXT) TO service_role;

-- =========================================================================
-- SECTION 6: DRY RUN FUNCTION (Preview without deleting)
-- =========================================================================

CREATE OR REPLACE FUNCTION public.cleanup_dry_run()
RETURNS TABLE(
  category TEXT,
  table_name TEXT,
  rows_to_delete BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- OAuth
  RETURN QUERY SELECT 'oauth'::TEXT, 'oauth_states'::TEXT,
    (SELECT COUNT(*) FROM oauth_states WHERE expires_at < NOW() - INTERVAL '1 hour' OR used_at IS NOT NULL);
  
  -- Sessions
  RETURN QUERY SELECT 'sessions'::TEXT, 'producer_sessions'::TEXT,
    (SELECT COUNT(*) FROM producer_sessions WHERE expires_at < NOW() - INTERVAL '7 days');
  RETURN QUERY SELECT 'sessions'::TEXT, 'buyer_sessions'::TEXT,
    (SELECT COUNT(*) FROM buyer_sessions WHERE expires_at < NOW() - INTERVAL '7 days');
  
  -- Security
  RETURN QUERY SELECT 'security'::TEXT, 'vault_access_log'::TEXT,
    (SELECT COUNT(*) FROM vault_access_log WHERE created_at < NOW() - INTERVAL '90 days');
  RETURN QUERY SELECT 'security'::TEXT, 'key_rotation_log'::TEXT,
    (SELECT COUNT(*) FROM key_rotation_log WHERE started_at < NOW() - INTERVAL '365 days');
  RETURN QUERY SELECT 'security'::TEXT, 'security_events'::TEXT,
    (SELECT COUNT(*) FROM security_events WHERE created_at < NOW() - INTERVAL '90 days');
  
  -- GDPR
  RETURN QUERY SELECT 'gdpr'::TEXT, 'gdpr_requests'::TEXT,
    (SELECT COUNT(*) FROM gdpr_requests WHERE status IN ('completed', 'rejected') AND processed_at < NOW() - INTERVAL '90 days');
  RETURN QUERY SELECT 'gdpr'::TEXT, 'gdpr_audit_log'::TEXT,
    (SELECT COUNT(*) FROM gdpr_audit_log WHERE executed_at < NOW() - INTERVAL '365 days');
  
  -- Rate Limiting
  RETURN QUERY SELECT 'rate_limit'::TEXT, 'rate_limit_attempts'::TEXT,
    (SELECT COUNT(*) FROM rate_limit_attempts WHERE created_at < NOW() - INTERVAL '24 hours');
  RETURN QUERY SELECT 'rate_limit'::TEXT, 'buyer_rate_limits'::TEXT,
    (SELECT COUNT(*) FROM buyer_rate_limits WHERE (blocked_until IS NOT NULL AND blocked_until < NOW() - INTERVAL '24 hours') OR (blocked_until IS NULL AND last_attempt_at < NOW() - INTERVAL '24 hours'));
  
  -- Legacy
  RETURN QUERY SELECT 'legacy'::TEXT, 'trigger_debug_logs'::TEXT,
    (SELECT COUNT(*) FROM trigger_debug_logs WHERE created_at < NOW() - INTERVAL '7 days');
  RETURN QUERY SELECT 'legacy'::TEXT, 'security_audit_log'::TEXT,
    (SELECT COUNT(*) FROM security_audit_log WHERE created_at < NOW() - INTERVAL '90 days');
  RETURN QUERY SELECT 'legacy'::TEXT, 'checkout_visits'::TEXT,
    (SELECT COUNT(*) FROM checkout_visits WHERE visited_at < NOW() - INTERVAL '365 days');
  RETURN QUERY SELECT 'legacy'::TEXT, 'webhook_deliveries'::TEXT,
    (SELECT COUNT(*) FROM webhook_deliveries WHERE (status = 'success' AND created_at < NOW() - INTERVAL '30 days') OR (status = 'failed' AND created_at < NOW() - INTERVAL '90 days'));
  RETURN QUERY SELECT 'legacy'::TEXT, 'gateway_webhook_dlq'::TEXT,
    (SELECT COUNT(*) FROM gateway_webhook_dlq WHERE status IN ('resolved', 'abandoned') AND resolved_at < NOW() - INTERVAL '90 days');
  RETURN QUERY SELECT 'legacy'::TEXT, 'order_events'::TEXT,
    (SELECT COUNT(*) FROM order_events WHERE occurred_at < NOW() - INTERVAL '180 days');
END;
$$;

REVOKE ALL ON FUNCTION public.cleanup_dry_run() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_dry_run() TO service_role;