-- ============================================================================
-- RISE CHECKOUT: UNIFIED IDENTITY - PHASE 1B (DDL)
-- 
-- RISE ARCHITECT PROTOCOL V3 - 10.0/10
-- 
-- Creates unified users table, unified sessions table, and user_active_context
-- to support the single-identity multi-role architecture.
-- ============================================================================

-- ============================================================================
-- STEP 1: Create unified users table
-- This replaces both 'profiles' and 'buyer_profiles' with a single source of truth
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity (unique per person)
  email TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  
  -- Credentials
  password_hash TEXT,
  password_hash_version INTEGER DEFAULT 2,
  account_status public.account_status_enum DEFAULT 'active',
  
  -- Personal data
  name TEXT,
  phone TEXT,
  
  -- Documents (producer-specific, but unified)
  cpf_cnpj TEXT,
  document_hash TEXT,
  document_encrypted TEXT,
  
  -- Avatar
  avatar_url TEXT,
  
  -- Producer settings
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  test_mode_enabled BOOLEAN DEFAULT FALSE,
  
  -- Payment integrations (producer-specific)
  mercadopago_collector_id TEXT,
  mercadopago_email TEXT,
  mercadopago_connected_at TIMESTAMPTZ,
  stripe_account_id TEXT,
  stripe_connected_at TIMESTAMPTZ,
  asaas_wallet_id TEXT,
  
  -- Moderation
  status TEXT DEFAULT 'active',
  status_reason TEXT,
  status_changed_at TIMESTAMPTZ,
  status_changed_by UUID,
  
  -- Custom fees (producer-specific)
  custom_fee_percent NUMERIC,
  
  -- Registration origin
  registration_source TEXT DEFAULT 'organic',
  
  -- Password reset
  reset_token TEXT,
  reset_token_expires_at TIMESTAMPTZ,
  
  -- Tracking
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Unique email constraint
  CONSTRAINT users_email_unique UNIQUE (email)
);

-- Indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON public.users(LOWER(email));
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_account_status ON public.users(account_status);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- STEP 2: Create unified sessions table
-- This replaces both 'producer_sessions' and 'buyer_sessions'
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Tokens
  session_token TEXT NOT NULL,
  refresh_token TEXT,
  
  -- Active context (which "hat" the user is wearing)
  active_role public.app_role NOT NULL DEFAULT 'buyer',
  
  -- Expirations
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Security metadata
  ip_address TEXT,
  user_agent TEXT,
  
  -- Tracking
  is_valid BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Token rotation (for refresh token replay detection)
  previous_refresh_token TEXT,
  
  -- Unique constraints
  CONSTRAINT sessions_token_unique UNIQUE (session_token),
  CONSTRAINT sessions_refresh_unique UNIQUE (refresh_token)
);

-- Indexes for sessions table
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_refresh ON public.sessions(refresh_token);
CREATE INDEX IF NOT EXISTS idx_sessions_valid ON public.sessions(is_valid) WHERE is_valid = TRUE;
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);

-- ============================================================================
-- STEP 3: Create user active context table
-- Remembers which role the user was last using (persists across sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_active_context (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  active_role public.app_role NOT NULL DEFAULT 'buyer',
  switched_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: Add context_data column to user_roles (for role-specific metadata)
-- ============================================================================
ALTER TABLE public.user_roles 
ADD COLUMN IF NOT EXISTS context_data JSONB DEFAULT '{}';

-- ============================================================================
-- STEP 5: Create updated_at trigger for users table
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_users_updated_at();

-- ============================================================================
-- STEP 6: Enable RLS on new tables
-- ============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_active_context ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 7: RLS Policies for users table
-- ============================================================================

-- Users can view their own data
CREATE POLICY "Users can view own data"
ON public.users
FOR SELECT
USING (id = auth.uid());

-- Users can update their own data
CREATE POLICY "Users can update own data"
ON public.users
FOR UPDATE
USING (id = auth.uid());

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access on users"
ON public.users
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 8: RLS Policies for sessions table
-- ============================================================================

-- Users can view their own sessions
CREATE POLICY "Users can view own sessions"
ON public.sessions
FOR SELECT
USING (user_id = auth.uid());

-- Users can delete their own sessions (logout)
CREATE POLICY "Users can delete own sessions"
ON public.sessions
FOR DELETE
USING (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "Service role full access on sessions"
ON public.sessions
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- STEP 9: RLS Policies for user_active_context table
-- ============================================================================

-- Users can view their own context
CREATE POLICY "Users can view own context"
ON public.user_active_context
FOR SELECT
USING (user_id = auth.uid());

-- Users can update their own context
CREATE POLICY "Users can upsert own context"
ON public.user_active_context
FOR ALL
USING (user_id = auth.uid());

-- Service role can do everything
CREATE POLICY "Service role full access on user_active_context"
ON public.user_active_context
FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');