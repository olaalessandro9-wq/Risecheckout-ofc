-- ============================================================================
-- RISE CHECKOUT: UNIFIED IDENTITY - PHASE 1A (ENUM EXPANSION)
-- 
-- RISE ARCHITECT PROTOCOL V3 - 10.0/10
-- 
-- Expands app_role enum to include 'buyer'.
-- This must be committed before using the new value.
-- ============================================================================

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'buyer';