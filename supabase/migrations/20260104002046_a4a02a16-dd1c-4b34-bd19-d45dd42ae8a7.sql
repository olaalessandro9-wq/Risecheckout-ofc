-- 1. Criar schema dedicado para extensões (se não existir)
CREATE SCHEMA IF NOT EXISTS extensions;

-- 2. Mover extensão unaccent para o schema extensions
ALTER EXTENSION unaccent SET SCHEMA extensions;

-- 3. Garantir permissões no schema extensions
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role;