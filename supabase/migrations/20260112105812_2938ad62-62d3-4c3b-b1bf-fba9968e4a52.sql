-- Adicionar coluna registration_source na tabela profiles
-- Valores: 'producer' (padrão), 'affiliate', 'buyer'
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS registration_source text DEFAULT 'producer';

-- Comentário para documentação
COMMENT ON COLUMN profiles.registration_source IS 'Origem do cadastro: producer, affiliate, ou buyer. Apenas para diagnóstico interno do owner.';