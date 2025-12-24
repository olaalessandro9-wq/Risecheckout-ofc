-- Atualizar função can_have_affiliates para permitir APENAS owner
-- Antes: owner E admin podiam ter afiliados
-- Agora: SOMENTE owner (a plataforma) pode ter programa de afiliados

CREATE OR REPLACE FUNCTION public.can_have_affiliates(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Buscar o role do usuário
  SELECT role::text INTO v_role
  FROM public.user_roles
  WHERE user_id = p_user_id
  LIMIT 1;
  
  -- Se não tem role, não pode ter afiliados
  IF v_role IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- APENAS owner pode ter programa de afiliados
  -- Owner = Plataforma/Checkout
  RETURN v_role = 'owner';
END;
$$;

-- Adicionar comentário explicativo
COMMENT ON FUNCTION public.can_have_affiliates(uuid) IS 
'Verifica se o usuário pode ter programa de afiliados. 
APENAS o Owner (plataforma) pode ter afiliados.
Vendedores podem SE AFILIAR a produtos, mas não podem TER afiliados próprios.';