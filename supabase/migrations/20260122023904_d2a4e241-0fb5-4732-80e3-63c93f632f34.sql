-- =============================================
-- LIMPEZA DE PAYMENT_LINKS ÓRFÃOS
-- Corrige links de ofertas deletadas/inexistentes
-- =============================================

-- 1. Marcar payment_links de ofertas DELETADAS como inativos
UPDATE payment_links 
SET status = 'inactive'
WHERE offer_id IN (
  SELECT id FROM offers WHERE status = 'deleted'
)
AND status = 'active';

-- 2. Marcar payment_links de ofertas que NÃO EXISTEM como inativos
UPDATE payment_links 
SET status = 'inactive'
WHERE offer_id NOT IN (SELECT id FROM offers)
AND status = 'active';

-- 3. Deletar checkout_links que referenciam checkouts inexistentes
DELETE FROM checkout_links 
WHERE checkout_id NOT IN (SELECT id FROM checkouts);

-- 4. Deletar checkout_links que referenciam links inativos
DELETE FROM checkout_links 
WHERE link_id IN (
  SELECT id FROM payment_links WHERE status = 'inactive'
);