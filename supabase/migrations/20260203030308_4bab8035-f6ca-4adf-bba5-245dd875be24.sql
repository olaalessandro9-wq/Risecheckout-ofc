-- RISE V3: Eliminação de funções SQL legadas que consultavam auth.users
-- Data: 2026-02-03
-- Motivo: auth.users está abandonada, 'users' é o SSOT

-- 1. Dropar função que consultava auth.users diretamente
DROP FUNCTION IF EXISTS public.get_auth_user_by_email(text);

-- 2. Reescrever get_user_email para usar tabela 'users' (SSOT)
CREATE OR REPLACE FUNCTION public.get_user_email(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  -- RISE V3: Query diretamente da tabela 'users' (SSOT)
  -- Não usa mais auth.users (tabela abandonada)
  SELECT email INTO user_email
  FROM users
  WHERE id = user_id;
  
  RETURN user_email;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_user_email(uuid) IS 'RISE V3: Returns user email from users table (SSOT). Does NOT query auth.users.';