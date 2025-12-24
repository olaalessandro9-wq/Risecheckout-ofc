-- ============================================================================
-- SECURITY FIX: Critical Vulnerabilities
-- ============================================================================

-- 1. DROP backup table without RLS (exposes historical pricing data)
DROP TABLE IF EXISTS public.offers_backup_20251126;

-- 2. REMOVE service_role_key from app_settings (god-mode key in database)
DELETE FROM public.app_settings WHERE key = 'supabase_service_role_key';

-- 3. DROP dangerous RLS policy that exposes payment credentials publicly
DROP POLICY IF EXISTS "Public can view active vendor integrations" ON public.vendor_integrations;

-- ============================================================================
-- VERIFICATION: Ensure vendor_integrations still has proper owner-only access
-- ============================================================================
-- The existing "Vendors can view own integrations" policy remains intact
-- This allows vendors to manage their own integrations while blocking public access