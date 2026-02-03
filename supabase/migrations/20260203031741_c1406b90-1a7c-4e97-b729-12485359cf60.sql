-- =====================================================
-- RISE V3: DROP versões legadas de get_producer_affiliates
-- =====================================================
-- Elimina overloads que usavam auth.users/profiles
-- Mantém apenas a versão SSOT (uuid) criada na migração anterior

-- DROP overload com (text) - versão legada
DROP FUNCTION IF EXISTS public.get_producer_affiliates(text);

-- DROP overload com (uuid, text) - versão legada  
DROP FUNCTION IF EXISTS public.get_producer_affiliates(uuid, text);

-- A versão correta get_producer_affiliates(uuid) usando tabela 'users'
-- já foi criada na migração 20260203030755