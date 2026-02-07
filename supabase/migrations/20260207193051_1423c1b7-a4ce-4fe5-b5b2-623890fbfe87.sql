-- Step-Up MFA: Add mfa_verified_at to sessions table
-- Tracks when a session was authenticated via MFA during login.
-- NULL = session created without MFA (user hasn't configured MFA yet)
-- Timestamp = session was MFA-verified at this time

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS mfa_verified_at TIMESTAMPTZ DEFAULT NULL;