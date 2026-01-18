-- ============================================================================
-- FASE 2: Refatorar Password Markers
-- Adiciona coluna account_status para eliminar uso de strings mágicas em password_hash
-- ============================================================================

-- 1. Criar ENUM para status de conta
DO $$ BEGIN
  CREATE TYPE account_status_enum AS ENUM (
    'active',           -- Conta normal, senha definida
    'pending_setup',    -- Aguardando definição de senha (ex: buyer criado via compra)
    'reset_required',   -- Precisa redefinir senha (solicitou reset)
    'owner_no_password' -- Produtor com acesso via producer-auth (sem senha própria)
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Adicionar coluna em profiles (producers)
DO $$ BEGIN
  ALTER TABLE profiles ADD COLUMN account_status account_status_enum DEFAULT 'active';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 3. Adicionar coluna em buyer_profiles
DO $$ BEGIN
  ALTER TABLE buyer_profiles ADD COLUMN account_status account_status_enum DEFAULT 'active';
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 4. Migrar dados existentes em profiles baseado nos password_hash markers
UPDATE profiles SET account_status = 'reset_required' 
WHERE password_hash = 'REQUIRES_RESET' AND account_status = 'active';

UPDATE profiles SET account_status = 'pending_setup' 
WHERE password_hash = 'PENDING_PASSWORD_SETUP' AND account_status = 'active';

UPDATE profiles SET account_status = 'owner_no_password' 
WHERE password_hash = 'OWNER_NO_PASSWORD' AND account_status = 'active';

-- 5. Migrar dados existentes em buyer_profiles baseado nos password_hash markers
UPDATE buyer_profiles SET account_status = 'reset_required' 
WHERE password_hash = 'REQUIRES_RESET' AND account_status = 'active';

UPDATE buyer_profiles SET account_status = 'pending_setup' 
WHERE password_hash = 'PENDING_PASSWORD_SETUP' AND account_status = 'active';

-- 6. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON profiles(account_status) WHERE account_status != 'active';
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_account_status ON buyer_profiles(account_status) WHERE account_status != 'active';

-- 7. Comentários explicativos
COMMENT ON COLUMN profiles.account_status IS 'Status da conta: active, pending_setup, reset_required, owner_no_password';
COMMENT ON COLUMN buyer_profiles.account_status IS 'Status da conta: active, pending_setup, reset_required, owner_no_password';