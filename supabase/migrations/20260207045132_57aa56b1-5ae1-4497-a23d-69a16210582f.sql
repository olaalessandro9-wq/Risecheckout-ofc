-- Add email verification columns to public.users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS email_verification_token text,
  ADD COLUMN IF NOT EXISTS email_verification_token_expires_at timestamptz;

-- Add pending_email_verification to the account_status_enum
ALTER TYPE public.account_status_enum ADD VALUE IF NOT EXISTS 'pending_email_verification';