-- ============================================================================
-- RISE CHECKOUT: UNIFIED IDENTITY - PHASE 3 (SESSION MIGRATION)
-- 
-- RISE ARCHITECT PROTOCOL V3 - 10.0/10
-- 
-- Migrates producer_sessions and buyer_sessions to the unified sessions table.
-- Uses migration_id_map for buyer_id reconciliation.
-- ============================================================================

-- ============================================================================
-- STEP 1: Migrate producer_sessions to unified sessions table
-- Producer sessions get active_role = 'user'
-- ============================================================================
INSERT INTO public.sessions (
  id, user_id, session_token, refresh_token, active_role,
  access_token_expires_at, refresh_token_expires_at, expires_at,
  ip_address, user_agent, is_valid, created_at, last_activity_at, previous_refresh_token
)
SELECT 
  ps.id, 
  ps.producer_id,  -- producer_id maps directly to users.id (same as profiles.id)
  ps.session_token, 
  ps.refresh_token, 
  'user'::public.app_role,  -- Producers default to 'user' role context
  ps.access_token_expires_at, 
  ps.refresh_token_expires_at, 
  ps.expires_at,
  ps.ip_address, 
  ps.user_agent, 
  ps.is_valid, 
  ps.created_at, 
  ps.last_activity_at, 
  ps.previous_refresh_token
FROM producer_sessions ps
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = ps.producer_id)
ON CONFLICT (session_token) DO NOTHING;

-- ============================================================================
-- STEP 2: Migrate buyer_sessions to unified sessions table
-- Uses migration_id_map to resolve merged buyer IDs
-- Buyer sessions get active_role = 'buyer'
-- ============================================================================
INSERT INTO public.sessions (
  id, user_id, session_token, refresh_token, active_role,
  access_token_expires_at, refresh_token_expires_at, expires_at,
  ip_address, user_agent, is_valid, created_at, last_activity_at, previous_refresh_token
)
SELECT 
  bs.id,
  -- Use mapped ID if buyer was merged, otherwise use original buyer_id
  COALESCE(m.new_id, bs.buyer_id),
  bs.session_token, 
  bs.refresh_token, 
  'buyer'::public.app_role,  -- Buyers default to 'buyer' role context
  bs.access_token_expires_at, 
  bs.refresh_token_expires_at, 
  bs.expires_at,
  bs.ip_address, 
  bs.user_agent, 
  bs.is_valid, 
  bs.created_at, 
  bs.last_activity_at, 
  bs.previous_refresh_token
FROM buyer_sessions bs
LEFT JOIN public.migration_id_map m ON bs.buyer_id = m.old_id 
  AND m.source_table IN ('buyer_profiles', 'buyer_profiles_merged')
WHERE EXISTS (
  SELECT 1 FROM public.users u 
  WHERE u.id = COALESCE(m.new_id, bs.buyer_id)
)
ON CONFLICT (session_token) DO NOTHING;