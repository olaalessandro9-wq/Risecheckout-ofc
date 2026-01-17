-- ============================================================================
-- PHASE 1 & 4: Timezone Architecture Migration
-- 
-- Adds timezone column to profiles table and updates get_dashboard_metrics RPC
-- to use timezone-aware date comparisons.
--
-- @version RISE Protocol V3 - Solution C (10.0 score)
-- ============================================================================

-- ============================================================================
-- 1. ADD TIMEZONE COLUMN TO PROFILES
-- ============================================================================

-- Add timezone column with Brazil default (IANA format)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS timezone TEXT 
DEFAULT 'America/Sao_Paulo' NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_timezone 
ON profiles(timezone);

-- Add constraint for valid IANA timezone format (basic validation)
-- Allows patterns like: America/Sao_Paulo, Europe/London, Asia/Tokyo, UTC
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_timezone_valid'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_timezone_valid 
    CHECK (timezone ~ '^[A-Za-z]+(/[A-Za-z_]+)?$');
  END IF;
END $$;

COMMENT ON COLUMN profiles.timezone IS 
'IANA timezone identifier (e.g., America/Sao_Paulo). Used for all date displays and filters.';

-- ============================================================================
-- 2. UPDATE get_dashboard_metrics RPC TO USE TIMEZONE
-- ============================================================================

-- Drop existing function to recreate with new signature
DROP FUNCTION IF EXISTS get_dashboard_metrics(uuid, timestamptz, timestamptz);
DROP FUNCTION IF EXISTS get_dashboard_metrics(uuid, timestamptz, timestamptz, text);

-- Create timezone-aware version
CREATE OR REPLACE FUNCTION public.get_dashboard_metrics(
  p_vendor_id uuid, 
  p_start_date timestamp with time zone, 
  p_end_date timestamp with time zone,
  p_timezone text DEFAULT 'America/Sao_Paulo'
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result JSON;
  v_start_date date;
  v_end_date date;
BEGIN
  -- Extract the DATE portion from the input timestamps in the vendor's timezone
  -- This ensures that a sale at 21:50 São Paulo on Jan 15 (stored as 00:50 UTC Jan 16)
  -- is correctly counted for Jan 15 when filtering by "Jan 15"
  v_start_date := (p_start_date AT TIME ZONE p_timezone)::date;
  v_end_date := (p_end_date AT TIME ZONE p_timezone)::date;

  SELECT json_build_object(
    'paid_count', COUNT(*) FILTER (WHERE LOWER(status) = 'paid'),
    'pending_count', COUNT(*) FILTER (WHERE LOWER(status) = 'pending'),
    'total_count', COUNT(*),
    'paid_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'paid'), 0),
    'pending_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'pending'), 0),
    'total_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) IN ('paid', 'pending')), 0),
    'pix_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'paid' AND LOWER(payment_method) = 'pix'), 0),
    'credit_card_revenue_cents', COALESCE(SUM(amount_cents) FILTER (WHERE LOWER(status) = 'paid' AND LOWER(payment_method) IN ('credit_card', 'creditcard')), 0),
    'fees_cents', COALESCE(
      SUM(ROUND(amount_cents * 0.0399) + 39) FILTER (WHERE LOWER(status) = 'paid'),
      0
    )
  ) INTO result
  FROM orders
  WHERE vendor_id = p_vendor_id
    -- Convert UTC timestamp to vendor timezone, then extract date for comparison
    -- This is the KEY fix: we compare DATES in the vendor's timezone, not UTC
    AND (created_at AT TIME ZONE p_timezone)::date >= v_start_date
    AND (created_at AT TIME ZONE p_timezone)::date <= v_end_date;
  
  RETURN result;
END;
$$;

COMMENT ON FUNCTION get_dashboard_metrics IS 
'Returns aggregated dashboard metrics for a vendor within a date range.
Uses the specified timezone (default: America/Sao_Paulo) for date comparisons.
This ensures sales are counted on the correct day regardless of UTC storage.';