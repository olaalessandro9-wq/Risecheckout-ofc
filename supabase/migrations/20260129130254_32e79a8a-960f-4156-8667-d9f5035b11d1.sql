-- ============================================
-- RISE V3 FASE 2: Migrar dados profiles → users e deprecar tabela
-- ============================================

-- 1. Sincronizar campos exclusivos de profiles para users (se houver dados)
-- Campos em profiles que não existem em users: test_public_key, test_access_token
-- Estes campos são de credenciais de teste - não precisam ser migrados (Vault)

-- 2. Verificar se há dados em profiles que não existem em users e sincronizar
INSERT INTO users (
  id, email, name, phone, cpf_cnpj, created_at, updated_at,
  test_mode_enabled, mercadopago_collector_id, mercadopago_email,
  mercadopago_connected_at, stripe_account_id, stripe_connected_at,
  asaas_wallet_id, status, status_reason, status_changed_at, 
  status_changed_by, custom_fee_percent, registration_source,
  password_hash
)
SELECT 
  p.id, 
  COALESCE(au.email, 'migrated_' || p.id || '@temp.local') as email,
  p.name,
  p.phone,
  p.cpf_cnpj,
  p.created_at,
  p.updated_at,
  p.test_mode_enabled,
  p.mercadopago_collector_id,
  p.mercadopago_email,
  p.mercadopago_connected_at,
  p.stripe_account_id,
  p.stripe_connected_at,
  p.asaas_wallet_id,
  p.status,
  p.status_reason,
  p.status_changed_at,
  p.status_changed_by,
  p.custom_fee_percent,
  'migrated_from_profiles' as registration_source,
  'MIGRATED_FROM_PROFILES' as password_hash
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.id)
ON CONFLICT (id) DO UPDATE SET
  name = COALESCE(users.name, EXCLUDED.name),
  phone = COALESCE(users.phone, EXCLUDED.phone),
  cpf_cnpj = COALESCE(users.cpf_cnpj, EXCLUDED.cpf_cnpj),
  test_mode_enabled = COALESCE(EXCLUDED.test_mode_enabled, users.test_mode_enabled),
  mercadopago_collector_id = COALESCE(EXCLUDED.mercadopago_collector_id, users.mercadopago_collector_id),
  mercadopago_email = COALESCE(EXCLUDED.mercadopago_email, users.mercadopago_email),
  mercadopago_connected_at = COALESCE(EXCLUDED.mercadopago_connected_at, users.mercadopago_connected_at),
  stripe_account_id = COALESCE(EXCLUDED.stripe_account_id, users.stripe_account_id),
  stripe_connected_at = COALESCE(EXCLUDED.stripe_connected_at, users.stripe_connected_at),
  asaas_wallet_id = COALESCE(EXCLUDED.asaas_wallet_id, users.asaas_wallet_id),
  custom_fee_percent = COALESCE(EXCLUDED.custom_fee_percent, users.custom_fee_percent),
  updated_at = NOW();

-- 3. Adicionar comentário de deprecação na tabela profiles
COMMENT ON TABLE profiles IS '⚠️ DEPRECATED [2026-01-29]: Esta tabela é LEGADA. Use a tabela "users" como SSOT para identidade de vendedores. FK profiles_id_fkey aponta para auth.users por herança do Supabase. NÃO USAR EM CÓDIGO NOVO.';

-- 4. Adicionar comentários nas colunas deprecadas
COMMENT ON COLUMN profiles.name IS '⚠️ DEPRECATED: Use users.name';
COMMENT ON COLUMN profiles.phone IS '⚠️ DEPRECATED: Use users.phone';
COMMENT ON COLUMN profiles.cpf_cnpj IS '⚠️ DEPRECATED: Use users.cpf_cnpj';
COMMENT ON COLUMN profiles.test_mode_enabled IS '⚠️ DEPRECATED: Use users.test_mode_enabled';
COMMENT ON COLUMN profiles.test_public_key IS '⚠️ DEPRECATED: Migrar para Vault';
COMMENT ON COLUMN profiles.test_access_token IS '⚠️ DEPRECATED: Migrar para Vault';
COMMENT ON COLUMN profiles.mercadopago_collector_id IS '⚠️ DEPRECATED: Use users.mercadopago_collector_id';
COMMENT ON COLUMN profiles.mercadopago_email IS '⚠️ DEPRECATED: Use users.mercadopago_email';
COMMENT ON COLUMN profiles.mercadopago_connected_at IS '⚠️ DEPRECATED: Use users.mercadopago_connected_at';
COMMENT ON COLUMN profiles.stripe_account_id IS '⚠️ DEPRECATED: Use users.stripe_account_id';
COMMENT ON COLUMN profiles.stripe_connected_at IS '⚠️ DEPRECATED: Use users.stripe_connected_at';
COMMENT ON COLUMN profiles.status IS '⚠️ DEPRECATED: Use users.status';
COMMENT ON COLUMN profiles.custom_fee_percent IS '⚠️ DEPRECATED: Use users.custom_fee_percent';
COMMENT ON COLUMN profiles.asaas_wallet_id IS '⚠️ DEPRECATED: Use users.asaas_wallet_id';