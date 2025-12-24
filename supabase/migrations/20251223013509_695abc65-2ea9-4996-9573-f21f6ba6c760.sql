-- ============================================================================
-- SYNC: Sincronizar products.price com offers.price (oferta padrão)
-- ============================================================================
-- Problema: Quando o preço da oferta padrão é alterado, products.price fica desatualizado
-- Solução: Trigger que sincroniza automaticamente products.price com a oferta padrão
-- ============================================================================

-- 1) Criar função de sincronização
CREATE OR REPLACE FUNCTION public.sync_product_price_from_default_offer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só sincroniza se for a oferta padrão ativa
  IF NEW.is_default = true AND NEW.status = 'active' THEN
    UPDATE products
    SET price = NEW.price,
        updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RAISE NOTICE '[sync_product_price] Produto % atualizado para preço %', NEW.product_id, NEW.price;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 2) Remover trigger antigo se existir
DROP TRIGGER IF EXISTS trigger_sync_product_price ON offers;

-- 3) Criar trigger para INSERT e UPDATE
CREATE TRIGGER trigger_sync_product_price
AFTER INSERT OR UPDATE OF price, is_default, status ON offers
FOR EACH ROW
EXECUTE FUNCTION sync_product_price_from_default_offer();

-- 4) Corrigir TODOS os dados existentes (sincronizar products.price com oferta padrão)
UPDATE products p
SET price = o.price,
    updated_at = NOW()
FROM offers o
WHERE o.product_id = p.id
  AND o.is_default = true
  AND o.status = 'active';

-- ============================================================================
-- Comentários
-- ============================================================================
COMMENT ON FUNCTION sync_product_price_from_default_offer() IS 
'Sincroniza automaticamente products.price quando a oferta padrão é alterada';

COMMENT ON TRIGGER trigger_sync_product_price ON offers IS 
'Dispara sincronização de preço quando oferta padrão é criada/atualizada';