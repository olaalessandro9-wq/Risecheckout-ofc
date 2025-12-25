-- =============================================================================
-- SECURITY FIX: Neutralize Exposed Secrets
-- =============================================================================
-- This migration removes all hardcoded secrets from the database that were
-- accidentally exposed in previous migrations.
-- =============================================================================

-- 1. Remove the exposed service_role_key from app_settings
-- CRITICAL: This key was compromised and MUST be rotated in Dashboard
DELETE FROM public.app_settings WHERE key = 'service_role_key';

-- 2. Remove the Stripe auto-fill trigger that contained hardcoded pk_test_
DROP TRIGGER IF EXISTS trg_auto_fill_stripe_public_key ON checkouts;
DROP FUNCTION IF EXISTS auto_fill_stripe_public_key();

-- 3. Add a security policy comment for future reference
COMMENT ON TABLE public.app_settings IS 'SECURITY: Never store API keys, secrets, or tokens in this table. Use Supabase Vault instead.';

-- 4. Create a security audit function to detect future violations
CREATE OR REPLACE FUNCTION public.check_no_secrets_in_settings()
RETURNS TRIGGER AS $$
BEGIN
  -- Block any attempts to store obvious secrets
  IF NEW.key ILIKE '%secret%' 
     OR NEW.key ILIKE '%key%' 
     OR NEW.key ILIKE '%token%' 
     OR NEW.key ILIKE '%password%'
     OR NEW.key ILIKE '%credential%' THEN
    RAISE EXCEPTION 'SECURITY VIOLATION: Cannot store secrets in app_settings. Use Supabase Vault instead. Attempted key: %', NEW.key;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to prevent future secret storage
DROP TRIGGER IF EXISTS trg_prevent_secrets_in_settings ON public.app_settings;
CREATE TRIGGER trg_prevent_secrets_in_settings
  BEFORE INSERT OR UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_no_secrets_in_settings();