-- =====================================================
-- Alterar role padrão de novos usuários para 'seller'
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
begin
  -- Criar perfil do usuário
  insert into public.profiles (id, name, phone, cpf_cnpj)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(new.raw_user_meta_data->>'cpf_cnpj', '')
  );
  
  -- Atribuir role 'seller' por padrão (antes era 'user')
  -- Sellers podem criar produtos e se afiliar, mas NÃO ter programa de afiliados
  -- Para liberar afiliados, promova para 'user' via update na tabela user_roles
  insert into public.user_roles (user_id, role)
  values (new.id, 'seller');
  
  return new;
end;
$function$;

-- Comentário na função para documentação
COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger que cria perfil e atribui role seller para novos usuários. 
Hierarquia: owner > admin > user > seller.
Para promover: UPDATE user_roles SET role = ''user'' WHERE user_id = ''uuid'';';