-- ============================================================================
-- RLS Security Test Helper Functions
-- ============================================================================
-- Functions to support the rls-security-tester edge function.
-- These run with SECURITY DEFINER to access system catalogs.
-- ============================================================================

-- Get RLS status for all tables
CREATE OR REPLACE FUNCTION public.get_rls_status_all_tables()
RETURNS TABLE(tablename TEXT, has_rls BOOLEAN)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    t.tablename::TEXT,
    c.relrowsecurity AS has_rls
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename AND c.relnamespace = 'public'::regnamespace
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
$$;

-- Get policy coverage for all tables
CREATE OR REPLACE FUNCTION public.get_policy_coverage()
RETURNS TABLE(
  tablename TEXT,
  select_policies BIGINT,
  insert_policies BIGINT,
  update_policies BIGINT,
  delete_policies BIGINT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.tablename::TEXT,
    COUNT(*) FILTER (WHERE p.cmd = 'SELECT' OR p.cmd = 'ALL') AS select_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'INSERT' OR p.cmd = 'ALL') AS insert_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'UPDATE' OR p.cmd = 'ALL') AS update_policies,
    COUNT(*) FILTER (WHERE p.cmd = 'DELETE' OR p.cmd = 'ALL') AS delete_policies
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  GROUP BY p.tablename
  ORDER BY p.tablename;
$$;

-- Get tables without any policies
CREATE OR REPLACE FUNCTION public.get_tables_without_policies()
RETURNS TEXT[]
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ARRAY_AGG(t.tablename::TEXT)
  FROM pg_tables t
  LEFT JOIN pg_policies p ON p.tablename = t.tablename AND p.schemaname = t.schemaname
  WHERE t.schemaname = 'public'
  GROUP BY t.tablename
  HAVING COUNT(p.policyname) = 0;
$$;

-- Get all policies with details
CREATE OR REPLACE FUNCTION public.get_all_policies()
RETURNS TABLE(
  tablename TEXT,
  policyname TEXT,
  cmd TEXT,
  permissive TEXT,
  roles TEXT[],
  qual TEXT,
  with_check TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.tablename::TEXT,
    p.policyname::TEXT,
    p.cmd::TEXT,
    p.permissive::TEXT,
    p.roles::TEXT[],
    p.qual::TEXT,
    p.with_check::TEXT
  FROM pg_policies p
  WHERE p.schemaname = 'public'
  ORDER BY p.tablename, p.policyname;
$$;

-- Grant execute to service role only (these are sensitive functions)
REVOKE ALL ON FUNCTION public.get_rls_status_all_tables() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_policy_coverage() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_tables_without_policies() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_all_policies() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_rls_status_all_tables() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_policy_coverage() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_tables_without_policies() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_all_policies() TO service_role;