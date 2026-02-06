-- Phase 1: Add mobile-specific component columns to checkouts table
-- RISE V3: Dual-Layout System for Checkout Builder
-- These columns store independent mobile layouts (mirroring Members Area Builder pattern)
-- Default empty array preserves backward compatibility: empty = "mobile synced with desktop"

ALTER TABLE public.checkouts
  ADD COLUMN IF NOT EXISTS mobile_top_components jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS mobile_bottom_components jsonb DEFAULT '[]'::jsonb;