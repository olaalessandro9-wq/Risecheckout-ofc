-- RISE V3: Migrar FK de buyer_content_progress para tabela unificada users
-- Causa: buyer_id agora referencia users.id (arquitetura unificada), não buyer_profiles

-- 1. Remover a FK legado para buyer_profiles
ALTER TABLE buyer_content_progress 
DROP CONSTRAINT IF EXISTS buyer_content_progress_buyer_id_fkey;

-- 2. Adicionar nova FK para tabela users (arquitetura unificada V3)
ALTER TABLE buyer_content_progress 
ADD CONSTRAINT buyer_content_progress_buyer_id_fkey 
FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE;