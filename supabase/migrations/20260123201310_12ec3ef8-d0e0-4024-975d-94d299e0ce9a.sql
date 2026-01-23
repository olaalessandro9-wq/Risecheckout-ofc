-- RISE V3 Phase 11: Fix get_producer_id_from_session to use unified sessions table
-- This function is used by RLS policies, now updated to unified auth model

CREATE OR REPLACE FUNCTION public.get_producer_id_from_session()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
  -- RISE V3: Unified auth model
  -- In the unified model, authentication is handled by Edge Functions
  -- which validate cookies and set the Supabase context.
  -- RLS policies should use auth.uid() directly.
  -- This function now simply returns auth.uid() for compatibility.
  RETURN auth.uid();
END;
$$;

COMMENT ON FUNCTION public.get_producer_id_from_session() IS 
'RISE V3: Returns auth.uid() for RLS policies. Session validation is handled by Edge Functions via unified-auth-v2.';