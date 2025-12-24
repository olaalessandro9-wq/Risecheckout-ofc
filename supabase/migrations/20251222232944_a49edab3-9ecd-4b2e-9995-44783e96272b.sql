-- Atualizar RLS da tabela profiles para usar has_min_role e reconhecer owner

DROP POLICY IF EXISTS profiles_select_v2 ON profiles;

CREATE POLICY "profiles_select_v3" ON profiles
  FOR SELECT TO public
  USING (
    auth.uid() = id 
    OR has_min_role(auth.uid(), 'admin'::app_role)
  );