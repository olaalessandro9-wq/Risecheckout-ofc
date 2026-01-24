-- RISE V3: Migrate orphan buyer to unified users table
-- This migrates maiconmiranda1528@gmail.com from buyer_profiles to users

INSERT INTO users (email, name, password_hash, account_status, created_at)
SELECT 
  LOWER(bp.email),
  bp.name,
  bp.password_hash,
  'active'::account_status_enum,
  bp.created_at
FROM buyer_profiles bp
WHERE bp.email = 'maiconmiranda1528@gmail.com'
  AND bp.password_hash IS NOT NULL
  AND bp.password_hash != 'PENDING_PASSWORD_SETUP'
ON CONFLICT (email) DO NOTHING;