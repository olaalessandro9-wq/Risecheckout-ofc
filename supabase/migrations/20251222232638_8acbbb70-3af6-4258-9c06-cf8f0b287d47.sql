-- Criar função has_min_role que verifica se o usuário tem pelo menos o role especificado
-- Hierarquia: owner > admin > user > seller

CREATE OR REPLACE FUNCTION public.has_min_role(_user_id uuid, _min_role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        CASE role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'user' THEN 2
          WHEN 'seller' THEN 1
          ELSE 0
        END
      ) >= (
        CASE _min_role
          WHEN 'owner' THEN 4
          WHEN 'admin' THEN 3
          WHEN 'user' THEN 2
          WHEN 'seller' THEN 1
          ELSE 0
        END
      )
  )
$$;

-- Remover policies antigas
DROP POLICY IF EXISTS user_roles_select_v2 ON user_roles;
DROP POLICY IF EXISTS user_roles_insert_v2 ON user_roles;
DROP POLICY IF EXISTS user_roles_update_v2 ON user_roles;
DROP POLICY IF EXISTS user_roles_delete_v2 ON user_roles;

-- SELECT: Usuário vê seu próprio OU admin/owner vê todos
CREATE POLICY "user_roles_select_v3" ON user_roles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id 
    OR has_min_role(auth.uid(), 'admin'::app_role)
  );

-- INSERT: Apenas admin/owner podem inserir
CREATE POLICY "user_roles_insert_v3" ON user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_min_role(auth.uid(), 'admin'::app_role));

-- UPDATE: Apenas admin/owner podem atualizar
CREATE POLICY "user_roles_update_v3" ON user_roles
  FOR UPDATE TO authenticated
  USING (has_min_role(auth.uid(), 'admin'::app_role));

-- DELETE: Apenas admin/owner podem deletar
CREATE POLICY "user_roles_delete_v3" ON user_roles
  FOR DELETE TO authenticated
  USING (has_min_role(auth.uid(), 'admin'::app_role));