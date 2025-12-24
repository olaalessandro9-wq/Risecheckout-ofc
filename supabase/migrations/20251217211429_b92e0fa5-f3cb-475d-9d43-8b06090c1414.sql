-- ============================================================================
-- CORREÇÃO: Sincronização de Public Keys do Mercado Pago
-- ============================================================================

-- 1) CORREÇÃO IMEDIATA: Atualizar checkouts existentes com a Public Key correta
-- Busca a public_key de vendor_integrations e atualiza todos os checkouts do vendor
UPDATE checkouts c
SET mercadopago_public_key = vi.config->>'public_key'
FROM products p
JOIN vendor_integrations vi ON vi.vendor_id = p.user_id
WHERE c.product_id = p.id
  AND vi.integration_type = 'MERCADOPAGO'
  AND vi.active = true
  AND vi.config->>'public_key' IS NOT NULL;

-- 2) TRIGGER: Sincronizar checkouts automaticamente quando vendor_integrations mudar
CREATE OR REPLACE FUNCTION public.sync_vendor_checkouts_payment_keys()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Só processa integrações do Mercado Pago
  IF NEW.integration_type = 'MERCADOPAGO' AND NEW.active = true THEN
    -- Atualiza todos os checkouts dos produtos deste vendor
    UPDATE checkouts c
    SET mercadopago_public_key = NEW.config->>'public_key'
    FROM products p
    WHERE c.product_id = p.id
      AND p.user_id = NEW.vendor_id
      AND NEW.config->>'public_key' IS NOT NULL;
    
    RAISE NOTICE '[sync_vendor_checkouts] Atualizados checkouts do vendor % com public_key %', 
      NEW.vendor_id, 
      LEFT(NEW.config->>'public_key', 20) || '...';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Remove trigger antigo se existir
DROP TRIGGER IF EXISTS trg_sync_vendor_checkouts_payment_keys ON vendor_integrations;

-- Cria o trigger para INSERT e UPDATE
CREATE TRIGGER trg_sync_vendor_checkouts_payment_keys
  AFTER INSERT OR UPDATE ON vendor_integrations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_vendor_checkouts_payment_keys();

-- ============================================================================
-- ✅ MIGRAÇÃO COMPLETA
-- - Checkouts existentes atualizados com a Public Key correta
-- - Trigger criado para sincronização automática futura
-- ============================================================================