-- Fix RLS policies for coupon_products table
-- The RESTRICTIVE policy "Deny all access to coupon_products by default" was blocking all operations

-- Drop the restrictive policy that blocks everything
DROP POLICY IF EXISTS "Deny all access to coupon_products by default" ON coupon_products;

-- Keep the other policies as they are correct:
-- 1. Users can view coupon_products for their products (SELECT)
-- 2. Users can insert coupon_products (INSERT) - no qual needed as validation happens via product_id FK
-- 3. Users can update coupon_products for their products (UPDATE)
-- 4. Users can delete coupon_products for their products (DELETE)
-- 5. Admins can manage all coupon_products (ALL)
-- 6. Deny anonymous access (anon role)

-- Ensure RLS is enabled
ALTER TABLE coupon_products ENABLE ROW LEVEL SECURITY;
