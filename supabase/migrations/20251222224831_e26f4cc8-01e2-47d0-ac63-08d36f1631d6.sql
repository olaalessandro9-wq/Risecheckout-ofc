-- Corrigir roles duplicados do usuário e promover para owner
-- Deletar registro duplicado (user)
DELETE FROM user_roles WHERE id = '43b5b124-c759-439a-baa6-601f2d47c41c';

-- Atualizar para owner
UPDATE user_roles 
SET role = 'owner' 
WHERE id = '4782c1de-8a3f-4f73-b5b8-8092915e8035';