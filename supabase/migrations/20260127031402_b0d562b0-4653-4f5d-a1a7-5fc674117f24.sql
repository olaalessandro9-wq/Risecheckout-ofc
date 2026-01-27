-- RISE V3: Correção de FK user_roles para apontar para public.users
-- Inclui limpeza de registros órfãos

-- 1. Remover FK antiga (aponta para auth.users)
ALTER TABLE public.user_roles 
DROP CONSTRAINT IF EXISTS user_roles_user_id_fkey;

-- 2. Limpar registros órfãos (user_id que não existem em public.users)
DELETE FROM public.user_roles ur
WHERE NOT EXISTS (SELECT 1 FROM public.users u WHERE u.id = ur.user_id);

-- 3. Adicionar FK correta (aponta para public.users)
ALTER TABLE public.user_roles 
ADD CONSTRAINT user_roles_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 4. Atribuir role 'seller' para usuários sem role que registraram via /cadastro
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'seller'::app_role
FROM public.users u
WHERE u.registration_source IN ('organic', 'affiliate', 'producer')
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = u.id
  );

-- 5. Atualizar sessões ativas com role errada
UPDATE public.sessions s
SET active_role = 'seller'
FROM public.users u
WHERE s.user_id = u.id
  AND u.registration_source IN ('organic', 'affiliate')
  AND s.active_role = 'buyer'
  AND s.is_valid = true;

-- 6. Atualizar user_active_context com role errada
UPDATE public.user_active_context uac
SET active_role = 'seller'
FROM public.users u
WHERE uac.user_id = u.id
  AND u.registration_source IN ('organic', 'affiliate')
  AND uac.active_role = 'buyer';