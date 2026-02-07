-- Add terms acceptance timestamp for LGPD-compliant consent tracking
-- Nullable because existing users won't have this value
ALTER TABLE public.users ADD COLUMN terms_accepted_at timestamptz;