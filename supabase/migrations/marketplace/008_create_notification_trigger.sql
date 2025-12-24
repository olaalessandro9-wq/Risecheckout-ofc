-- ============================================
-- MIGRATION 008: Trigger de notificação para novos afiliados
-- Descrição: Notifica produtor quando alguém solicita afiliação
-- Data: 20/12/2025
-- Autor: Manus AI
-- ============================================

-- Função de notificação
CREATE OR REPLACE FUNCTION notify_producer_new_affiliate()
RETURNS TRIGGER AS $$
DECLARE
  v_product_name TEXT;
  v_affiliate_name TEXT;
  v_producer_id UUID;
BEGIN
  -- Só notifica se for solicitação pendente
  IF NEW.status = 'pending' THEN
    
    -- Buscar dados do produto e produtor
    SELECT p.name, p.user_id 
    INTO v_product_name, v_producer_id
    FROM products p
    WHERE p.id = NEW.product_id;
    
    -- Buscar nome do afiliado
    SELECT prof.name 
    INTO v_affiliate_name
    FROM profiles prof
    WHERE prof.id = NEW.user_id;
    
    -- Inserir notificação
    INSERT INTO notifications (
      user_id, 
      type, 
      title, 
      message, 
      data
    ) VALUES (
      v_producer_id,
      'new_affiliate_request',
      'Nova solicitação de afiliação',
      v_affiliate_name || ' solicitou promover "' || v_product_name || '"',
      jsonb_build_object(
        'affiliate_id', NEW.id,
        'product_id', NEW.product_id,
        'affiliate_user_id', NEW.user_id,
        'product_name', v_product_name,
        'affiliate_name', v_affiliate_name
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger
DROP TRIGGER IF EXISTS on_new_affiliate_request ON affiliates;

CREATE TRIGGER on_new_affiliate_request
  AFTER INSERT ON affiliates
  FOR EACH ROW
  EXECUTE FUNCTION notify_producer_new_affiliate();

-- Comentário
COMMENT ON FUNCTION notify_producer_new_affiliate IS 'Notifica produtor quando há nova solicitação de afiliação';
