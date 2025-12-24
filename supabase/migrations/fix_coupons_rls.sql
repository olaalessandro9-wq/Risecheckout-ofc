-- Fix RLS policies for coupons table
-- The RESTRICTIVE policy "Deny all access to coupons by default" was blocking all operations

-- Drop the restrictive policy that blocks everything
DROP POLICY IF EXISTS "Deny all access to coupons by default" ON coupons;

-- Keep the other policies as they are correct:
-- 1. Users can view coupons for their products (SELECT)
-- 2. Users can insert coupons (INSERT) - no qual needed as validation happens via coupon_products
-- 3. Users can update coupons for their products (UPDATE)
-- 4. Users can delete coupons for their products (DELETE)
-- 5. Admins can manage all coupons (ALL)
-- 6. Deny anonymous access (anon role)

-- Ensure RLS is enabled
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
