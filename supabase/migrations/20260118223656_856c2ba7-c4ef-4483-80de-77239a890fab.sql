-- ============================================
-- ROTAÇÃO DE REFRESH TOKENS - FASE 1
-- Adiciona suporte para detecção de roubo de tokens
-- ============================================

-- Adicionar coluna para armazenar o token anterior (producer)
ALTER TABLE producer_sessions 
ADD COLUMN IF NOT EXISTS previous_refresh_token TEXT;

-- Adicionar coluna para armazenar o token anterior (buyer)
ALTER TABLE buyer_sessions 
ADD COLUMN IF NOT EXISTS previous_refresh_token TEXT;

-- Índices para busca rápida de tokens reutilizados (detecção de roubo)
CREATE INDEX IF NOT EXISTS idx_producer_sessions_prev_refresh 
ON producer_sessions(previous_refresh_token) 
WHERE previous_refresh_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_buyer_sessions_prev_refresh 
ON buyer_sessions(previous_refresh_token) 
WHERE previous_refresh_token IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN producer_sessions.previous_refresh_token IS 'Token anterior após rotação. Usado para detectar roubo de token.';
COMMENT ON COLUMN buyer_sessions.previous_refresh_token IS 'Token anterior após rotação. Usado para detectar roubo de token.';