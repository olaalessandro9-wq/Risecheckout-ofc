-- Corrigir account_status para usuários que já redefiniram senha
-- mas ainda estão com status "pending_setup"
-- Isso inclui o usuário rdgsandro1@gmail.com

UPDATE profiles
SET account_status = 'active'
WHERE password_hash IS NOT NULL
  AND account_status = 'pending_setup'
  AND password_hash NOT IN (
    'REQUIRES_PASSWORD_RESET',
    'PENDING_PASSWORD_SETUP',
    'OWNER_NO_PASSWORD'
  );