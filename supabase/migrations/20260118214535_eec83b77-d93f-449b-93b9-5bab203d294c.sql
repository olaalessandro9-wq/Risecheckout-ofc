-- ============================================================================
-- FASE 3: Implementar Refresh Tokens
-- Adiciona suporte a access tokens de curta duração + refresh tokens de longa duração
-- ============================================================================

-- 1. Adicionar colunas em producer_sessions
ALTER TABLE producer_sessions
ADD COLUMN IF NOT EXISTS refresh_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ;

-- 2. Adicionar colunas em buyer_sessions
ALTER TABLE buyer_sessions
ADD COLUMN IF NOT EXISTS refresh_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS refresh_token_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ;

-- 3. Criar índices para lookup rápido de refresh tokens
CREATE INDEX IF NOT EXISTS idx_producer_sessions_refresh_token 
ON producer_sessions(refresh_token) 
WHERE is_valid = true AND refresh_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buyer_sessions_refresh_token 
ON buyer_sessions(refresh_token) 
WHERE is_valid = true AND refresh_token IS NOT NULL;

-- 4. Comentários explicativos
COMMENT ON COLUMN producer_sessions.refresh_token IS 'Token de longa duração (30 dias) para obter novos access tokens';
COMMENT ON COLUMN producer_sessions.refresh_token_expires_at IS 'Data de expiração do refresh token';
COMMENT ON COLUMN producer_sessions.access_token_expires_at IS 'Data de expiração do access token (15 minutos)';

COMMENT ON COLUMN buyer_sessions.refresh_token IS 'Token de longa duração (30 dias) para obter novos access tokens';
COMMENT ON COLUMN buyer_sessions.refresh_token_expires_at IS 'Data de expiração do refresh token';
COMMENT ON COLUMN buyer_sessions.access_token_expires_at IS 'Data de expiração do access token (15 minutos)';