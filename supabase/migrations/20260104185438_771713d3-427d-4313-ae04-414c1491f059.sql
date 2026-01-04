-- Fase 0: Adicionar coluna para versão do hash de senha
-- Permite migração progressiva de SHA-256 para bcrypt

ALTER TABLE public.buyer_profiles 
ADD COLUMN IF NOT EXISTS password_hash_version INTEGER DEFAULT 1;

-- Versão 1 = SHA-256 (legado)
-- Versão 2 = bcrypt (novo)

COMMENT ON COLUMN public.buyer_profiles.password_hash_version IS 'Versão do algoritmo de hash: 1=SHA-256 (legado), 2=bcrypt (seguro)';