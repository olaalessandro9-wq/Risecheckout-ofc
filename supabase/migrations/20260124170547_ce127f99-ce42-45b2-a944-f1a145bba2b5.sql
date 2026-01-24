-- ================================================================
-- RISE V3 FINAL MIGRATION: Complete SSOT for buyer_groups & student_invite_tokens
-- ================================================================
-- First drop legacy FKs, then migrate data, then add new FKs
-- ================================================================

-- STEP 1: Drop legacy FK on buyer_groups FIRST (before any updates)
ALTER TABLE buyer_groups 
  DROP CONSTRAINT IF EXISTS buyer_groups_buyer_id_fkey;

-- STEP 2: Drop legacy FK on student_invite_tokens FIRST
ALTER TABLE student_invite_tokens 
  DROP CONSTRAINT IF EXISTS student_invite_tokens_buyer_id_fkey;

-- STEP 3: Migrate buyer_groups.buyer_id from buyer_profiles.id to users.id
-- Only for records that still point to buyer_profiles
UPDATE buyer_groups bg
SET buyer_id = u.id
FROM buyer_profiles bp
JOIN users u ON LOWER(u.email) = LOWER(bp.email)
WHERE bg.buyer_id = bp.id
  AND u.id IS NOT NULL
  AND bg.buyer_id NOT IN (SELECT id FROM users);

-- STEP 4: Migrate student_invite_tokens.buyer_id from buyer_profiles.id to users.id  
-- Only for records that still point to buyer_profiles
UPDATE student_invite_tokens sit
SET buyer_id = u.id
FROM buyer_profiles bp
JOIN users u ON LOWER(u.email) = LOWER(bp.email)
WHERE sit.buyer_id = bp.id
  AND u.id IS NOT NULL
  AND sit.buyer_id NOT IN (SELECT id FROM users);

-- STEP 5: Add new FK on buyer_groups pointing to users
ALTER TABLE buyer_groups 
  ADD CONSTRAINT buyer_groups_buyer_id_fkey 
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE;

-- STEP 6: Add new FK on student_invite_tokens pointing to users
ALTER TABLE student_invite_tokens 
  ADD CONSTRAINT student_invite_tokens_buyer_id_fkey 
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE;