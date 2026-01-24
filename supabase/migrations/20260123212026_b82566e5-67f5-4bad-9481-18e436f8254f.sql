-- RISE V3: Final Cleanup - Remove legacy function wrapper
-- This function was refactored to return auth.uid() but is no longer needed
-- No RLS policies depend on it

DROP FUNCTION IF EXISTS public.get_producer_id_from_session();

-- Update schema comment to reflect 100% clean state
COMMENT ON SCHEMA public IS 'RISE V3 Unified Identity - 100% Clean - 2026-01-23';