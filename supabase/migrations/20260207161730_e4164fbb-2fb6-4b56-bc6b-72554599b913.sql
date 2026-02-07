-- RISE V3 10.0/10: Atomic MFA attempt increment
-- Eliminates race condition in read-then-write pattern
-- by delegating atomicity to PostgreSQL (correct responsibility layer)

CREATE OR REPLACE FUNCTION public.increment_mfa_attempts(p_token TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE mfa_sessions
  SET attempts = attempts + 1
  WHERE token = p_token;
END;
$$;

-- Revoke direct access - only callable via service_role (Edge Functions)
REVOKE ALL ON FUNCTION public.increment_mfa_attempts(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_mfa_attempts(TEXT) TO service_role;