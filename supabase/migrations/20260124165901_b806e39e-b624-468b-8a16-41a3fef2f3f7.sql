-- =============================================================
-- RISE V3 Migration: buyer_product_access → users.id
-- Ordem correta: DROP FK primeiro, UPDATE depois, ADD FK por último
-- =============================================================

-- Etapa 1: Remover FK antiga PRIMEIRO (para permitir IDs mistos durante migração)
ALTER TABLE buyer_product_access 
  DROP CONSTRAINT IF EXISTS buyer_product_access_buyer_id_fkey;

-- Etapa 2: Migrar buyer_id de buyer_profiles.id para users.id
-- Só atualiza registros onde buyer_id existe em buyer_profiles
UPDATE buyer_product_access bpa
SET buyer_id = u.id
FROM buyer_profiles bp
JOIN users u ON LOWER(u.email) = LOWER(bp.email)
WHERE bpa.buyer_id = bp.id;

-- Etapa 3: Adicionar nova FK para users
ALTER TABLE buyer_product_access 
  ADD CONSTRAINT buyer_product_access_buyer_id_fkey 
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE;