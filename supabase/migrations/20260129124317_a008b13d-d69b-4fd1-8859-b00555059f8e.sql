-- ============================================================================
-- FASE 0: Limpeza e sincronização de usuários órfãos
-- ============================================================================

-- PASSO 1: Deletar registros órfãos de vendor_profiles
DELETE FROM vendor_profiles
WHERE user_id IN (
  '7465b6fd-25cc-4684-b1da-924d7ddcf2dd',
  '8ab70886-3d97-421e-844a-b45f5a0b53d6',
  'd8095b47-bd91-4e41-925d-b116df22352e',
  'f661c0cd-62df-48ba-b319-72f110480227'
);

-- PASSO 2: Inserir usuários que só existem em auth.users
INSERT INTO users (id, email, name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.id IN (
  '8ab70886-3d97-421e-844a-b45f5a0b53d6',
  'f661c0cd-62df-48ba-b319-72f110480227'
)
ON CONFLICT (id) DO NOTHING;

-- PASSO 3: Garantir role de seller para novos usuários
INSERT INTO user_roles (user_id, role)
SELECT au.id, 'seller'::app_role
FROM auth.users au
WHERE au.id IN (
  '8ab70886-3d97-421e-844a-b45f5a0b53d6',
  'f661c0cd-62df-48ba-b319-72f110480227'
)
ON CONFLICT DO NOTHING;