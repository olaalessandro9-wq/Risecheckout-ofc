-- ============================================
-- MIGRATION 003: Trigger de sincronização marketplace/affiliates
-- Descrição: Garante que marketplace só funciona se afiliados estiver ativo
-- Data: 20/12/2025
-- Autor: Manus AI
-- ============================================

-- Função de sincronização
CREATE OR REPLACE FUNCTION sync_marketplace_with_affiliates()
RETURNS TRIGGER AS $$
BEGIN
  -- Se afiliados desabilitado, forçar marketplace = false
  IF (NEW.affiliate_settings->>'enabled')::boolean = false THEN
    NEW.show_in_marketplace := false;
  END IF;
  
  -- Registrar timestamp quando habilitou marketplace pela primeira vez
  IF NEW.show_in_marketplace = true 
     AND (OLD.show_in_marketplace IS NULL OR OLD.show_in_marketplace = false) THEN
    NEW.marketplace_enabled_at := now();
  END IF;
  
  -- Se desabilitou marketplace, limpar timestamp
  IF NEW.show_in_marketplace = false AND OLD.show_in_marketplace = true THEN
    NEW.marketplace_enabled_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger
DROP TRIGGER IF EXISTS ensure_marketplace_requires_affiliates ON products;

CREATE TRIGGER ensure_marketplace_requires_affiliates
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION sync_marketplace_with_affiliates();

-- Comentário
COMMENT ON FUNCTION sync_marketplace_with_affiliates IS 'Sincroniza estado do marketplace com programa de afiliados';
