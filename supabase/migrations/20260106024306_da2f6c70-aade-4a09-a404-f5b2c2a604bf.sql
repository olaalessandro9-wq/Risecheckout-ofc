-- Fix access_type constraint to allow 'invite' and 'purchase' values
-- Drop existing constraint
ALTER TABLE buyer_product_access 
DROP CONSTRAINT IF EXISTS buyer_product_access_access_type_check;

-- Add new constraint with correct values
ALTER TABLE buyer_product_access 
ADD CONSTRAINT buyer_product_access_access_type_check 
CHECK (access_type = ANY (ARRAY['lifetime', 'subscription', 'limited', 'invite', 'purchase']));

-- Update existing manual entries (from producer grants) to 'invite'
UPDATE buyer_product_access 
SET access_type = 'invite' 
WHERE access_type = 'manual';

-- Update existing lifetime entries that came from purchases to 'purchase'
UPDATE buyer_product_access 
SET access_type = 'purchase' 
WHERE access_type = 'lifetime' 
AND order_id != '00000000-0000-0000-0000-000000000000';