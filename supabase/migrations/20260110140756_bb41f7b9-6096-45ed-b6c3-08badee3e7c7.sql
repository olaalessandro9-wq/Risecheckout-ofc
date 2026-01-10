-- ============================================================================
-- Adicionar colunas para reset de senha do Buyer
-- ============================================================================

-- Adicionar colunas reset_token e reset_token_expires_at
ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS reset_token TEXT,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMPTZ;

-- Criar índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_reset_token 
ON public.buyer_profiles(reset_token) 
WHERE reset_token IS NOT NULL;