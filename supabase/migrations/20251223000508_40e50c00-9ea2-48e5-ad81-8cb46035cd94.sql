-- Adicionar campos de status e taxa personalizada na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS custom_fee_percent NUMERIC(5,4) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_reason TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_changed_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS status_changed_by UUID DEFAULT NULL;

-- Adicionar constraint para validar status
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT profiles_status_check 
    CHECK (status IN ('active', 'suspended', 'banned'));
  END IF;
END $$;

-- Comentários explicativos
COMMENT ON COLUMN public.profiles.status IS 'Status do usuário: active, suspended, banned';
COMMENT ON COLUMN public.profiles.custom_fee_percent IS 'Taxa personalizada do checkout (NULL = usa padrão 4%)';
COMMENT ON COLUMN public.profiles.status_reason IS 'Motivo da suspensão/banimento';
COMMENT ON COLUMN public.profiles.status_changed_at IS 'Data/hora da última mudança de status';
COMMENT ON COLUMN public.profiles.status_changed_by IS 'ID do owner que alterou o status';