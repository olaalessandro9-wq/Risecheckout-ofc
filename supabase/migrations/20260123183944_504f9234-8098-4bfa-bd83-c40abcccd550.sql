-- ============================================================
-- FASE 4: MIGRAÇÃO DE SESSÕES LEGADAS PARA TABELA UNIFICADA
-- RISE V3 Protocol - Zero Dívida Técnica
-- ============================================================

-- 1. MIGRAR producer_sessions válidas para sessions
-- Producer usa role 'user' (vendedor/produtor)
INSERT INTO sessions (
  id,
  user_id,
  session_token,
  refresh_token,
  active_role,
  access_token_expires_at,
  refresh_token_expires_at,
  expires_at,
  ip_address,
  user_agent,
  is_valid,
  created_at,
  last_activity_at,
  previous_refresh_token
)
SELECT 
  gen_random_uuid(),
  ps.producer_id,
  ps.session_token,
  ps.refresh_token,
  'user'::app_role,
  ps.access_token_expires_at,
  ps.refresh_token_expires_at,
  ps.expires_at,
  ps.ip_address,
  ps.user_agent,
  ps.is_valid,
  ps.created_at,
  ps.last_activity_at,
  ps.previous_refresh_token
FROM producer_sessions ps
WHERE ps.is_valid = true 
  AND ps.expires_at > NOW()
  AND NOT EXISTS (
    SELECT 1 FROM sessions s WHERE s.session_token = ps.session_token
  );

-- 2. MIGRAR buyer_sessions válidas para sessions
-- Buyer usa role 'buyer' e precisa resolver via email
INSERT INTO sessions (
  id,
  user_id,
  session_token,
  refresh_token,
  active_role,
  access_token_expires_at,
  refresh_token_expires_at,
  expires_at,
  ip_address,
  user_agent,
  is_valid,
  created_at,
  last_activity_at,
  previous_refresh_token
)
SELECT 
  gen_random_uuid(),
  u.id,
  bs.session_token,
  bs.refresh_token,
  'buyer'::app_role,
  bs.access_token_expires_at,
  bs.refresh_token_expires_at,
  bs.expires_at,
  bs.ip_address,
  bs.user_agent,
  bs.is_valid,
  bs.created_at,
  bs.last_activity_at,
  bs.previous_refresh_token
FROM buyer_sessions bs
JOIN buyer_profiles bp ON bp.id = bs.buyer_id
JOIN users u ON LOWER(u.email) = LOWER(bp.email)
WHERE bs.is_valid = true 
  AND bs.expires_at > NOW()
  AND NOT EXISTS (
    SELECT 1 FROM sessions s WHERE s.session_token = bs.session_token
  );

-- 3. INVALIDAR sessões antigas nas tabelas legadas
-- Isso força novos logins a usarem o sistema unificado
UPDATE producer_sessions 
SET is_valid = false 
WHERE is_valid = true;

UPDATE buyer_sessions 
SET is_valid = false 
WHERE is_valid = true;