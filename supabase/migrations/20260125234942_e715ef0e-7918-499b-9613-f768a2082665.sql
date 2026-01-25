-- ============================================================================
-- MIGRATION: Add viewport column for Dual-Layout Desktop/Mobile
-- RISE Protocol V3 - 10.0/10 Solution
-- ============================================================================

-- 1. Add viewport column to product_members_sections
ALTER TABLE public.product_members_sections 
ADD COLUMN IF NOT EXISTS viewport TEXT NOT NULL DEFAULT 'desktop' 
CHECK (viewport IN ('desktop', 'mobile'));

-- 2. Add index for efficient filtering by viewport
CREATE INDEX IF NOT EXISTS idx_product_members_sections_viewport 
ON public.product_members_sections(product_id, viewport);

-- 3. Add comment for documentation
COMMENT ON COLUMN public.product_members_sections.viewport IS 
'Layout viewport: desktop or mobile. Enables independent layouts per device type.';

-- NOTE: Existing sections remain as 'desktop'. Mobile sections will be auto-generated
-- on first load if not present (handled by application layer).
