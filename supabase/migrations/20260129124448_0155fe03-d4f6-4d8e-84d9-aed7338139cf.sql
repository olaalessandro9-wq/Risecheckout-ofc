-- Limpar registros órfãos de producer_audit_log antes da migração de FK
-- O usuário usuarioteste@gmail.com não existe mais em users
DELETE FROM producer_audit_log
WHERE producer_id = 'c2a6102e-7203-43fb-8123-335078d2bba2';

-- Sincronizar usuarioteste@gmail.com para users (se existir em auth.users)
INSERT INTO users (id, email, name, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'name', 'Usuário'),
  au.created_at,
  NOW()
FROM auth.users au
WHERE au.id = 'c2a6102e-7203-43fb-8123-335078d2bba2'
ON CONFLICT (id) DO NOTHING;