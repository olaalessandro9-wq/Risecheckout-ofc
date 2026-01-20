-- ============================================================================
-- RPC Function: get_auth_user_by_email
-- 
-- RISE Protocol V3 Compliant
-- 
-- Busca um usuário na tabela auth.users por email.
-- Resolve o problema de paginação do listUsers que não encontra usuários.
-- 
-- @version 1.0.0
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(user_email TEXT)
RETURNS TABLE (
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    au.id,
    au.email,
    au.created_at
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(user_email)
  LIMIT 1;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.get_auth_user_by_email IS 
'Busca usuário em auth.users por email. Usado para sincronização de usuários órfãos (existe em auth.users mas não em profiles).';

-- Grant para service role (edge functions)
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email TO service_role;