
-- ============================================================================
-- MFA Tables Migration
-- RISE Protocol V3 - Zero Trust MFA for Admin/Owner roles
-- ============================================================================

-- Table: user_mfa
-- Stores TOTP secrets (encrypted) and backup codes for MFA-enabled users
CREATE TABLE public.user_mfa (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  totp_secret_encrypted text NOT NULL,
  totp_secret_iv text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT false,
  backup_codes_hash text[] NOT NULL DEFAULT '{}',
  backup_codes_used text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  last_used_at timestamptz,
  CONSTRAINT user_mfa_user_id_unique UNIQUE (user_id)
);

-- Table: mfa_sessions
-- Temporary tokens issued after password validation, consumed after TOTP verification
CREATE TABLE public.mfa_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  is_used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  CONSTRAINT mfa_sessions_token_unique UNIQUE (token)
);

-- Indexes for performance
CREATE INDEX idx_mfa_sessions_token ON public.mfa_sessions (token) WHERE is_used = false;
CREATE INDEX idx_mfa_sessions_expires_at ON public.mfa_sessions (expires_at) WHERE is_used = false;
CREATE INDEX idx_mfa_sessions_user_id ON public.mfa_sessions (user_id);

-- Enable RLS on both tables
ALTER TABLE public.user_mfa ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mfa_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies: DENY ALL client access (only service_role can access)
-- user_mfa: No client access at all - only Edge Functions with service_role
CREATE POLICY "Deny all client access to user_mfa"
  ON public.user_mfa
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- mfa_sessions: No client access at all - only Edge Functions with service_role
CREATE POLICY "Deny all client access to mfa_sessions"
  ON public.mfa_sessions
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Trigger for updated_at on user_mfa
CREATE TRIGGER update_user_mfa_updated_at
  BEFORE UPDATE ON public.user_mfa
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Comment tables for documentation
COMMENT ON TABLE public.user_mfa IS 'Stores MFA (TOTP) configuration per user. Secrets are AES-256-GCM encrypted. Only accessible via service_role (Edge Functions).';
COMMENT ON TABLE public.mfa_sessions IS 'Temporary MFA verification sessions. Created after password validation, consumed after TOTP verification. TTL: 5 minutes.';
COMMENT ON COLUMN public.user_mfa.totp_secret_encrypted IS 'AES-256-GCM encrypted TOTP secret. Encrypted with MFA_ENCRYPTION_KEY.';
COMMENT ON COLUMN public.user_mfa.totp_secret_iv IS 'Initialization vector used for AES-256-GCM encryption of the TOTP secret.';
COMMENT ON COLUMN public.user_mfa.backup_codes_hash IS 'Array of bcrypt-hashed backup codes for emergency access.';
COMMENT ON COLUMN public.user_mfa.backup_codes_used IS 'Array of bcrypt-hashed backup codes that have been consumed.';
COMMENT ON COLUMN public.mfa_sessions.attempts IS 'Number of verification attempts made with this session token.';
COMMENT ON COLUMN public.mfa_sessions.max_attempts IS 'Maximum allowed verification attempts before session is invalidated.';
