-- ============================================================================
-- RISE Protocol V3 - Order Bumps Migration to Product Level
-- ============================================================================
-- Purpose: Migrate order_bumps from checkout-level to product-level association
-- This ensures all checkouts of a product show the same order bumps
-- ============================================================================

-- 1. Add column for the PARENT product (the product that owns the checkout)
ALTER TABLE order_bumps 
ADD COLUMN parent_product_id UUID REFERENCES products(id);

-- 2. Populate based on current checkout associations
UPDATE order_bumps ob
SET parent_product_id = c.product_id
FROM checkouts c
WHERE ob.checkout_id = c.id;

-- 3. Make NOT NULL after migration
ALTER TABLE order_bumps 
ALTER COLUMN parent_product_id SET NOT NULL;

-- 4. Make checkout_id NULLABLE (deprecated, will be removed later)
ALTER TABLE order_bumps 
ALTER COLUMN checkout_id DROP NOT NULL;

-- 5. Create index for performance
CREATE INDEX idx_order_bumps_parent_product_id 
ON order_bumps(parent_product_id);

-- 6. Add comment for documentation
COMMENT ON COLUMN order_bumps.parent_product_id IS 'RISE V3: The product that owns this order bump. All checkouts of this product will show this bump.';
COMMENT ON COLUMN order_bumps.checkout_id IS 'DEPRECATED: Previously used to link bumps to specific checkouts. Now nullable, kept for backwards compatibility during migration period.';