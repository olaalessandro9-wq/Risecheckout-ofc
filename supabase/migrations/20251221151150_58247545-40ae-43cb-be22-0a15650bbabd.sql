-- Adicionar colunas para Stripe Connect na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connected_at TIMESTAMPTZ;

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.stripe_account_id IS 'ID da conta Stripe Connect do afiliado';
COMMENT ON COLUMN public.profiles.stripe_connected_at IS 'Data de conexão da conta Stripe';