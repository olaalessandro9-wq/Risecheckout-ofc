-- Device Trust System: Clear existing rate limits and IP blocks
-- RISE V3 - 2026-01-20

-- 1. Clear all rate limit attempts for the affected IP
DELETE FROM rate_limit_attempts 
WHERE identifier LIKE '%177.11.27.39%';

-- 2. Deactivate IP blocklist entries
UPDATE ip_blocklist 
SET is_active = false, 
    expires_at = NOW() 
WHERE ip_address = '177.11.27.39' 
  AND is_active = true;

-- 3. Clear rate limits for the email as well
DELETE FROM rate_limit_attempts 
WHERE identifier LIKE '%rdgsandro1@gmail.com%';

-- 4. Reset producer sessions to allow fresh login
UPDATE producer_sessions 
SET is_valid = false 
WHERE producer_id = '63f041b6-8890-4625-bac9-5f7bb7dd410a' 
  AND is_valid = true;