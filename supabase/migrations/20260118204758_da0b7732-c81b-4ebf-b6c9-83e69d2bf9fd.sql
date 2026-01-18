-- ============================================
-- RISE V3: Custom Session Token for RLS
-- ============================================
-- This function extracts producer_id from custom session token header
-- Falls back to auth.uid() for backwards compatibility during transition

CREATE OR REPLACE FUNCTION public.get_producer_id_from_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_session_token text;
  v_producer_id uuid;
BEGIN
  -- Try to get custom session token from request headers
  BEGIN
    v_session_token := current_setting('request.headers', true)::json->>'x-producer-session-token';
  EXCEPTION
    WHEN OTHERS THEN
      v_session_token := NULL;
  END;
  
  -- If no custom token, fall back to Supabase Auth
  IF v_session_token IS NULL OR v_session_token = '' THEN
    RETURN auth.uid();
  END IF;
  
  -- Look up producer_id from valid session
  SELECT producer_id INTO v_producer_id
  FROM producer_sessions
  WHERE session_token = v_session_token
    AND is_valid = true
    AND expires_at > now();
  
  -- If session found, return producer_id; otherwise fall back to auth.uid()
  IF v_producer_id IS NOT NULL THEN
    RETURN v_producer_id;
  END IF;
  
  RETURN auth.uid();
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_producer_id_from_session() TO anon, authenticated;

COMMENT ON FUNCTION public.get_producer_id_from_session() IS 'RISE V3: Returns producer_id from custom session token or falls back to auth.uid()';