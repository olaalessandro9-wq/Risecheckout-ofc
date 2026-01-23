-- ============================================================================
-- RISE CHECKOUT: UNIFIED IDENTITY - PHASE 2A (DATA MIGRATION - USERS)
-- 
-- RISE ARCHITECT PROTOCOL V3 - 10.0/10
-- 
-- Migrates data from profiles and buyer_profiles to the unified users table.
-- Handles email conflicts by merging records.
-- Does NOT touch user_roles (they reference auth.users, not our new users table)
-- ============================================================================

-- ============================================================================
-- STEP 1: Create temporary mapping table for ID reconciliation
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.migration_id_map (
  old_id UUID NOT NULL,
  new_id UUID NOT NULL,
  source_table TEXT NOT NULL,
  migrated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (old_id, source_table)
);

-- ============================================================================
-- STEP 2: Migrate all profiles to users table (producers first)
-- These are the "primary" identities - they keep their original IDs
-- ============================================================================
INSERT INTO public.users (
  id, email, email_verified, password_hash, password_hash_version, account_status,
  name, phone, cpf_cnpj, timezone, test_mode_enabled,
  mercadopago_collector_id, mercadopago_email, mercadopago_connected_at,
  stripe_account_id, stripe_connected_at, asaas_wallet_id,
  status, status_reason, status_changed_at, status_changed_by,
  custom_fee_percent, registration_source, reset_token, reset_token_expires_at,
  created_at, updated_at, last_login_at, is_active
)
SELECT 
  p.id, 
  LOWER(TRIM(p.email)), 
  FALSE, 
  p.password_hash, 
  COALESCE(p.password_hash_version, 2), 
  COALESCE(p.account_status, 'active'),
  p.name, 
  p.phone, 
  p.cpf_cnpj, 
  COALESCE(p.timezone, 'America/Sao_Paulo'), 
  COALESCE(p.test_mode_enabled, FALSE),
  p.mercadopago_collector_id, 
  p.mercadopago_email, 
  p.mercadopago_connected_at,
  p.stripe_account_id, 
  p.stripe_connected_at, 
  p.asaas_wallet_id,
  COALESCE(p.status, 'active'), 
  p.status_reason, 
  p.status_changed_at, 
  p.status_changed_by,
  p.custom_fee_percent, 
  COALESCE(p.registration_source, 'organic'), 
  p.reset_token, 
  p.reset_token_expires_at,
  COALESCE(p.created_at, NOW()), 
  COALESCE(p.updated_at, NOW()), 
  p.last_login_at, 
  COALESCE(p.is_active, TRUE)
FROM profiles p
ON CONFLICT (email) DO NOTHING;

-- Record the migration mapping (profiles keep same ID)
INSERT INTO public.migration_id_map (old_id, new_id, source_table)
SELECT p.id, p.id, 'profiles'
FROM profiles p
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = p.id);

-- ============================================================================
-- STEP 3: Migrate buyer_profiles that DON'T have email conflicts with profiles
-- These also keep their original IDs
-- ============================================================================
INSERT INTO public.users (
  id, email, email_verified, password_hash, password_hash_version, account_status,
  name, phone, document_hash, document_encrypted,
  reset_token, reset_token_expires_at,
  created_at, updated_at, last_login_at, is_active
)
SELECT 
  b.id,
  LOWER(TRIM(b.email)),
  COALESCE(b.email_verified, FALSE),
  b.password_hash, 
  COALESCE(b.password_hash_version, 2), 
  COALESCE(b.account_status, 'active'),
  b.name, 
  b.phone, 
  b.document_hash, 
  b.document_encrypted,
  b.reset_token, 
  b.reset_token_expires_at,
  COALESCE(b.created_at, NOW()), 
  COALESCE(b.updated_at, NOW()), 
  b.last_login_at, 
  COALESCE(b.is_active, TRUE)
FROM buyer_profiles b
WHERE NOT EXISTS (
  SELECT 1 FROM public.users u WHERE LOWER(TRIM(u.email)) = LOWER(TRIM(b.email))
);

-- Record the migration mapping for non-conflicting buyers
INSERT INTO public.migration_id_map (old_id, new_id, source_table)
SELECT b.id, b.id, 'buyer_profiles'
FROM buyer_profiles b
WHERE EXISTS (SELECT 1 FROM public.users u WHERE u.id = b.id);

-- ============================================================================
-- STEP 4: Map conflicting buyer_profiles to existing user records
-- These are buyers whose email matches a profile - they get merged
-- ============================================================================
INSERT INTO public.migration_id_map (old_id, new_id, source_table)
SELECT b.id, u.id, 'buyer_profiles_merged'
FROM buyer_profiles b
INNER JOIN public.users u ON LOWER(TRIM(u.email)) = LOWER(TRIM(b.email))
WHERE b.id != u.id
AND NOT EXISTS (
  SELECT 1 FROM public.migration_id_map m 
  WHERE m.old_id = b.id AND m.source_table = 'buyer_profiles'
);

-- ============================================================================
-- STEP 5: Set default active context for all users
-- Producers default to 'user', pure buyers default to 'buyer'
-- ============================================================================
INSERT INTO public.user_active_context (user_id, active_role)
SELECT u.id,
  CASE 
    WHEN EXISTS (SELECT 1 FROM profiles p WHERE p.id = u.id) THEN 'user'::public.app_role
    ELSE 'buyer'::public.app_role
  END
FROM public.users u
ON CONFLICT (user_id) DO NOTHING;